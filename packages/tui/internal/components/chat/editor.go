package chat

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/AryaLabsHQ/opencoder/internal/app"
	"github.com/AryaLabsHQ/opencoder/internal/commands"
	"github.com/AryaLabsHQ/opencoder/internal/components/dialog"
	"github.com/AryaLabsHQ/opencoder/internal/components/textarea"
	"github.com/AryaLabsHQ/opencoder/internal/image"
	"github.com/AryaLabsHQ/opencoder/internal/layout"
	"github.com/AryaLabsHQ/opencoder/internal/styles"
	"github.com/AryaLabsHQ/opencoder/internal/theme"
	"github.com/AryaLabsHQ/opencoder/internal/util"
	"github.com/charmbracelet/bubbles/v2/spinner"
	tea "github.com/charmbracelet/bubbletea/v2"
	"github.com/charmbracelet/lipgloss/v2"
)

type VerbGeneratedMsg struct {
	Verb string
	Text string
}

type NoOpMsg struct{}

type generateVerbTriggerMsg struct {
	text string
}

type VerbCycleMsg struct{}

type EditorComponent interface {
	tea.Model
	tea.ViewModel
	layout.Sizeable
	Content() string
	Lines() int
	Value() string
	Focused() bool
	Focus() (tea.Model, tea.Cmd)
	Blur()
	Submit() (tea.Model, tea.Cmd)
	Clear() (tea.Model, tea.Cmd)
	Paste() (tea.Model, tea.Cmd)
	Newline() (tea.Model, tea.Cmd)
	Previous() (tea.Model, tea.Cmd)
	Next() (tea.Model, tea.Cmd)
	SetInterruptKeyInDebounce(inDebounce bool)
}

type editorComponent struct {
	app                    *app.App
	width, height          int
	textarea               textarea.Model
	attachments            []app.Attachment
	history                []string
	historyIndex           int
	currentMessage         string
	spinner                spinner.Model
	verbText               string
	interruptKeyInDebounce bool
}

func (m *editorComponent) Init() tea.Cmd {
	return tea.Batch(
		m.textarea.Focus(),
		textarea.Blink,
		m.spinner.Tick,
		tea.EnableReportFocus,
		tea.Every(2*time.Second, func(t time.Time) tea.Msg {
			return VerbCycleMsg{}
		}),
	)
}

func (m *editorComponent) generateVerbCmd(text string) tea.Cmd {
	if len(strings.TrimSpace(text)) < 3 {
		return nil
	}

	return func() tea.Msg {
		if m.app.TurboProvider == nil {
			return NoOpMsg{}
		}

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		verb, err := m.app.GenerateStatusVerb(ctx, text)
		if err != nil {
			return NoOpMsg{}
		}

		return VerbGeneratedMsg{
			Verb: verb,
			Text: text,
		}
	}
}

func (m *editorComponent) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmds []tea.Cmd
	var cmd tea.Cmd

	switch msg := msg.(type) {
	case NoOpMsg:
		return m, nil

	case generateVerbTriggerMsg:
		// Only generate if we haven't already for this text
		if msg.text != m.verbText {
			m.verbText = msg.text
			if cmd := m.generateVerbCmd(msg.text); cmd != nil {
				return m, cmd
			}
		}
		return m, nil

	case VerbGeneratedMsg:
		currentText := strings.TrimSpace(m.textarea.Value())
		if currentText == msg.Text {
			m.app.AddPromptVerb(msg.Verb)
			m.app.VerbIndex = 0
		}
		return m, nil

	case VerbCycleMsg:
		if m.app.IsBusy() {
			m.app.CycleToNextVerb()
		}
		return m, tea.Every(2*time.Second, func(t time.Time) tea.Msg {
			return VerbCycleMsg{}
		})

	case spinner.TickMsg:
		m.spinner, cmd = m.spinner.Update(msg)
		return m, cmd

	case tea.KeyPressMsg:
		// Maximize editor responsiveness for printable characters
		if msg.Text != "" {
			if m.textarea.Value() == "" {
				m.app.ResetPromptVerbs()
				m.verbText = ""
			}

			m.textarea, cmd = m.textarea.Update(msg)
			cmds = append(cmds, cmd)

			currentText := strings.TrimSpace(m.textarea.Value())
			if len(currentText) >= 3 {
				cmds = append(cmds, tea.Tick(800*time.Millisecond, func(t time.Time) tea.Msg {
					if strings.TrimSpace(m.textarea.Value()) == currentText {
						return generateVerbTriggerMsg{text: currentText}
					}
					return NoOpMsg{}
				}))
			}

			return m, tea.Batch(cmds...)
		}
	case dialog.ThemeSelectedMsg:
		m.textarea = createTextArea(&m.textarea)
		m.spinner = createSpinner()
		return m, tea.Batch(m.spinner.Tick, m.textarea.Focus())
	case dialog.CompletionSelectedMsg:
		if msg.IsCommand {
			commandName := strings.TrimPrefix(msg.CompletionValue, "/")
			updated, cmd := m.Clear()
			m = updated.(*editorComponent)
			cmds = append(cmds, cmd)
			cmds = append(cmds, util.CmdHandler(commands.ExecuteCommandMsg(m.app.Commands[commands.CommandName(commandName)])))
			return m, tea.Batch(cmds...)
		} else {
			existingValue := m.textarea.Value()

			// Replace the current token (after last space)
			lastSpaceIndex := strings.LastIndex(existingValue, " ")
			if lastSpaceIndex == -1 {
				m.textarea.SetValue(msg.CompletionValue + " ")
			} else {
				modifiedValue := existingValue[:lastSpaceIndex+1] + msg.CompletionValue
				m.textarea.SetValue(modifiedValue + " ")
			}
			return m, nil
		}
	}

	m.spinner, cmd = m.spinner.Update(msg)
	cmds = append(cmds, cmd)

	m.textarea, cmd = m.textarea.Update(msg)
	cmds = append(cmds, cmd)

	return m, tea.Batch(cmds...)
}

func (m *editorComponent) Content() string {
	t := theme.CurrentTheme()
	base := styles.NewStyle().Foreground(t.Text()).Background(t.Background()).Render
	muted := styles.NewStyle().Foreground(t.TextMuted()).Background(t.Background()).Render
	promptStyle := styles.NewStyle().Foreground(t.Primary()).
		Padding(0, 0, 0, 1).
		Bold(true)
	prompt := promptStyle.Render(">")

	statusLine := ""
	if m.app.IsBusy() {
		statusVerb := strings.ToLower(m.app.GetStatusVerb())
		statusLine = styles.NewStyle().
			Padding(0, 1).
			Background(t.Background()).
			Render(muted(statusVerb) + m.spinner.View())
	}

	textarea := lipgloss.JoinHorizontal(
		lipgloss.Top,
		prompt,
		m.textarea.View(),
	)
	textarea = styles.NewStyle().
		Background(t.BackgroundElement()).
		Width(m.width).
		PaddingTop(1).
		PaddingBottom(1).
		BorderStyle(lipgloss.ThickBorder()).
		BorderForeground(t.Border()).
		BorderBackground(t.Background()).
		BorderLeft(true).
		BorderRight(true).
		Render(textarea)

	hint := base(m.getSubmitKeyText()) + muted(" send   ")
	if m.app.IsBusy() {
		keyText := m.getInterruptKeyText()
		if m.interruptKeyInDebounce {
			hint = base(keyText+" again") + muted(" interrupt")
		} else {
			hint = base(keyText) + muted(" interrupt")
		}
	}

	model := ""
	if m.app.MainModel != nil && m.app.MainProvider != nil {
		model = muted(m.app.MainProvider.Name) + base(" "+m.app.MainModel.Name)

		// show turbo model if configured
		if m.app.TurboModel != nil && m.app.TurboProvider != nil {
			if m.app.TurboProvider.Id == m.app.MainProvider.Id {
				model = model + muted(" (⚡"+m.app.TurboModel.Name+")")
			} else {
				model = model + muted(" (⚡"+m.app.TurboProvider.Name+"/"+m.app.TurboModel.Name+")")
			}
		}
	}

	space := m.width - 2 - lipgloss.Width(model) - lipgloss.Width(hint)
	spacer := styles.NewStyle().Background(t.Background()).Width(space).Render("")

	info := hint + spacer + model
	info = styles.NewStyle().Background(t.Background()).Padding(0, 1).Render(info)

	content := strings.Join([]string{"", statusLine, textarea, info}, "\n")

	return content
}

func (m *editorComponent) View() string {
	if m.Lines() > 1 {
		return ""
	}
	return m.Content()
}

func (m *editorComponent) Focused() bool {
	return m.textarea.Focused()
}

func (m *editorComponent) Focus() (tea.Model, tea.Cmd) {
	return m, m.textarea.Focus()
}

func (m *editorComponent) Blur() {
	m.textarea.Blur()
}

func (m *editorComponent) GetSize() (width, height int) {
	return m.width, m.height
}

func (m *editorComponent) SetSize(width, height int) tea.Cmd {
	m.width = width
	m.height = height
	return nil
}

func (m *editorComponent) Lines() int {
	return m.textarea.LineCount()
}

func (m *editorComponent) Value() string {
	return m.textarea.Value()
}

func (m *editorComponent) Submit() (tea.Model, tea.Cmd) {
	value := strings.TrimSpace(m.Value())
	if value == "" {
		return m, nil
	}
	if len(value) > 0 && value[len(value)-1] == '\\' {
		m.textarea.SetValue(value[:len(value)-1] + "\n")
		return m, nil
	}

	var cmds []tea.Cmd

	// Check if we need to generate verb before clearing
	needVerb := len(value) >= 3 && value != m.verbText

	updated, cmd := m.Clear()
	m = updated.(*editorComponent)
	cmds = append(cmds, cmd)

	attachments := m.attachments
	m.attachments = []app.Attachment{}

	cmds = append(cmds, util.CmdHandler(app.SendMsg{
		Text:        value,
		Attachments: attachments,
	}))

	// Generate verb for submitted text only if we haven't already
	if needVerb {
		if verbCmd := m.generateVerbCmd(value); verbCmd != nil {
			cmds = append(cmds, verbCmd)
		}
	}

	return m, tea.Batch(cmds...)
}

func (m *editorComponent) Clear() (tea.Model, tea.Cmd) {
	m.textarea.Reset()
	m.verbText = ""
	return m, nil
}

func (m *editorComponent) Paste() (tea.Model, tea.Cmd) {
	imageBytes, text, err := image.GetImageFromClipboard()
	if err != nil {
		slog.Error(err.Error())
		return m, nil
	}
	if len(imageBytes) != 0 {
		attachmentName := fmt.Sprintf("clipboard-image-%d", len(m.attachments))
		attachment := app.Attachment{FilePath: attachmentName, FileName: attachmentName, Content: imageBytes, MimeType: "image/png"}
		m.attachments = append(m.attachments, attachment)
	} else {
		m.textarea.SetValue(m.textarea.Value() + text)
	}
	return m, nil
}

func (m *editorComponent) Newline() (tea.Model, tea.Cmd) {
	m.textarea.Newline()
	return m, nil
}

func (m *editorComponent) Previous() (tea.Model, tea.Cmd) {
	currentLine := m.textarea.Line()

	// Only navigate history if we're at the first line
	if currentLine == 0 && len(m.history) > 0 {
		// Save current message if we're just starting to navigate
		if m.historyIndex == len(m.history) {
			m.currentMessage = m.textarea.Value()
		}

		// Go to previous message in history
		if m.historyIndex > 0 {
			m.historyIndex--
			m.textarea.SetValue(m.history[m.historyIndex])
		}
		return m, nil
	}
	return m, nil
}

func (m *editorComponent) Next() (tea.Model, tea.Cmd) {
	currentLine := m.textarea.Line()
	value := m.textarea.Value()
	lines := strings.Split(value, "\n")
	totalLines := len(lines)

	// Only navigate history if we're at the last line
	if currentLine == totalLines-1 {
		if m.historyIndex < len(m.history)-1 {
			// Go to next message in history
			m.historyIndex++
			m.textarea.SetValue(m.history[m.historyIndex])
		} else if m.historyIndex == len(m.history)-1 {
			// Return to the current message being composed
			m.historyIndex = len(m.history)
			m.textarea.SetValue(m.currentMessage)
		}
		return m, nil
	}
	return m, nil
}

func (m *editorComponent) SetInterruptKeyInDebounce(inDebounce bool) {
	m.interruptKeyInDebounce = inDebounce
}

func (m *editorComponent) getInterruptKeyText() string {
	return m.app.Commands[commands.SessionInterruptCommand].Keys()[0]
}

func (m *editorComponent) getSubmitKeyText() string {
	return m.app.Commands[commands.InputSubmitCommand].Keys()[0]
}

func createTextArea(existing *textarea.Model) textarea.Model {
	t := theme.CurrentTheme()
	bgColor := t.BackgroundElement()
	textColor := t.Text()
	textMutedColor := t.TextMuted()

	ta := textarea.New()

	ta.Styles.Blurred.Base = styles.NewStyle().Foreground(textColor).Background(bgColor).Lipgloss()
	ta.Styles.Blurred.CursorLine = styles.NewStyle().Background(bgColor).Lipgloss()
	ta.Styles.Blurred.Placeholder = styles.NewStyle().Foreground(textMutedColor).Background(bgColor).Lipgloss()
	ta.Styles.Blurred.Text = styles.NewStyle().Foreground(textColor).Background(bgColor).Lipgloss()
	ta.Styles.Focused.Base = styles.NewStyle().Foreground(textColor).Background(bgColor).Lipgloss()
	ta.Styles.Focused.CursorLine = styles.NewStyle().Background(bgColor).Lipgloss()
	ta.Styles.Focused.Placeholder = styles.NewStyle().Foreground(textMutedColor).Background(bgColor).Lipgloss()
	ta.Styles.Focused.Text = styles.NewStyle().Foreground(textColor).Background(bgColor).Lipgloss()
	ta.Styles.Cursor.Color = t.Primary()

	ta.Prompt = " "
	ta.ShowLineNumbers = false
	ta.CharLimit = -1
	ta.SetWidth(layout.Current.Container.Width - 6)

	if existing != nil {
		ta.SetValue(existing.Value())
		// ta.SetWidth(existing.Width())
		ta.SetHeight(existing.Height())
	}

	// ta.Focus()
	return ta
}

func createSpinner() spinner.Model {
	t := theme.CurrentTheme()
	return spinner.New(
		spinner.WithSpinner(spinner.Ellipsis),
		spinner.WithStyle(
			styles.NewStyle().
				Background(t.Background()).
				Foreground(t.TextMuted()).
				Width(3).
				Lipgloss(),
		),
	)
}

func NewEditorComponent(app *app.App) EditorComponent {
	s := createSpinner()
	ta := createTextArea(nil)

	return &editorComponent{
		app:                    app,
		textarea:               ta,
		history:                []string{},
		historyIndex:           0,
		currentMessage:         "",
		spinner:                s,
		verbText:               "",
		interruptKeyInDebounce: false,
	}
}

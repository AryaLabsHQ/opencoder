package dialog

import (
	"context"
	"fmt"
	"slices"
	"strings"

	"github.com/charmbracelet/bubbles/v2/key"
	tea "github.com/charmbracelet/bubbletea/v2"
	"github.com/charmbracelet/lipgloss/v2"
	"github.com/sst/opencode/internal/app"
	"github.com/sst/opencode/internal/components/modal"
	"github.com/sst/opencode/internal/layout"
	"github.com/sst/opencode/internal/theme"
	"github.com/sst/opencode/internal/util"
	"github.com/sst/opencode/pkg/client"
)

const (
	numVisibleModels = 10
	paneWidth        = 40
	totalDialogWidth = paneWidth*2 + 3 // 2 panes + divider
)

type ActivePane int

const (
	MainModelPane ActivePane = iota
	TurboModelPane
)

// ModelDialog interface for the model selection dialog
type ModelDialog interface {
	layout.Modal
}

type modelDialog struct {
	app                *app.App
	availableProviders []client.ProviderInfo

	// Main model selection
	mainProvider     client.ProviderInfo
	mainSelectedIdx  int
	mainScrollOffset int

	// Turbo model selection
	turboProvider     client.ProviderInfo
	turboSelectedIdx  int
	turboScrollOffset int

	// UI state
	activePane      ActivePane
	width           int
	height          int
	hScrollPossible bool

	modal *modal.Modal
}

type modelKeyMap struct {
	Up     key.Binding
	Down   key.Binding
	Left   key.Binding
	Right  key.Binding
	Tab    key.Binding
	Enter  key.Binding
	Escape key.Binding
}

var modelKeys = modelKeyMap{
	Up: key.NewBinding(
		key.WithKeys("up", "k"),
		key.WithHelp("↑", "previous model"),
	),
	Down: key.NewBinding(
		key.WithKeys("down", "j"),
		key.WithHelp("↓", "next model"),
	),
	Left: key.NewBinding(
		key.WithKeys("left", "h"),
		key.WithHelp("←", "previous provider"),
	),
	Right: key.NewBinding(
		key.WithKeys("right", "l"),
		key.WithHelp("→", "next provider"),
	),
	Tab: key.NewBinding(
		key.WithKeys("tab"),
		key.WithHelp("tab", "switch pane"),
	),
	Enter: key.NewBinding(
		key.WithKeys("enter"),
		key.WithHelp("enter", "save selection"),
	),
	Escape: key.NewBinding(
		key.WithKeys("escape"),
		key.WithHelp("escape", "cancel"),
	),
}

func (m *modelDialog) Init() tea.Cmd {
	if len(m.availableProviders) == 0 {
		return nil
	}

	// Initialize main provider and model
	if m.app.MainProvider != nil {
		m.mainProvider = *m.app.MainProvider
		models := m.getModelsForProvider(m.mainProvider)
		for i, model := range models {
			if m.app.MainModel != nil && model.Id == m.app.MainModel.Id {
				m.mainSelectedIdx = i
				// Adjust scroll position to keep selected model visible
				if m.mainSelectedIdx >= numVisibleModels {
					m.mainScrollOffset = m.mainSelectedIdx - (numVisibleModels - 1)
				}
				break
			}
		}
	} else {
		m.mainProvider = m.availableProviders[0]
	}

	// Initialize turbo provider and model
	m.turboProvider = m.mainProvider // Default to same as main

	if m.app.TurboProvider != nil && m.app.TurboModel != nil {
		m.turboProvider = *m.app.TurboProvider

		models := m.getModelsForProvider(m.turboProvider)
		for i, model := range models {
			if model.Id == m.app.TurboModel.Id {
				m.turboSelectedIdx = i
				// Adjust scroll position to keep selected model visible
				if m.turboSelectedIdx >= numVisibleModels {
					m.turboScrollOffset = m.turboSelectedIdx - (numVisibleModels - 1)
				}
				break
			}
		}
	} else {
		// If no turbo model is set, try to select a turbo model by default
		models := m.getModelsForProvider(m.turboProvider)
		for i, model := range models {
			if isTurboModel(model) {
				m.turboSelectedIdx = i
				break
			}
		}
	}

	return nil
}

func (m *modelDialog) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch {
		case key.Matches(msg, modelKeys.Up):
			m.moveSelectionUp()
		case key.Matches(msg, modelKeys.Down):
			m.moveSelectionDown()
		case key.Matches(msg, modelKeys.Left):
			if m.hScrollPossible {
				m.switchProvider(-1)
			}
		case key.Matches(msg, modelKeys.Right):
			if m.hScrollPossible {
				m.switchProvider(1)
			}
		case key.Matches(msg, modelKeys.Tab):
			m.switchPane()
		case key.Matches(msg, modelKeys.Enter):
			// Get selected models from both panes
			mainModels := m.getModelsForProvider(m.mainProvider)
			turboModels := m.getModelsForProvider(m.turboProvider)

			if len(mainModels) == 0 || len(turboModels) == 0 {
				return m, nil
			}

			mainSelectedModel := mainModels[m.mainSelectedIdx]
			turboSelectedModel := turboModels[m.turboSelectedIdx]

			return m, tea.Sequence(
				util.CmdHandler(modal.CloseModalMsg{}),
				util.CmdHandler(
					app.ModelSelectedMsg{
						MainProvider:  m.mainProvider,
						MainModel:     mainSelectedModel,
						TurboProvider: m.turboProvider,
						TurboModel:    turboSelectedModel,
					}),
			)
		case key.Matches(msg, modelKeys.Escape):
			return m, util.CmdHandler(modal.CloseModalMsg{})
		}
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
	}

	return m, nil
}

func (m *modelDialog) getModelsForProvider(provider client.ProviderInfo) []client.ModelInfo {
	var models []client.ModelInfo
	for _, model := range provider.Models {
		models = append(models, model)
	}
	slices.SortFunc(models, func(a, b client.ModelInfo) int {
		return strings.Compare(a.Name, b.Name)
	})
	return models
}

func (m *modelDialog) moveSelectionUp() {
	if m.activePane == MainModelPane {
		models := m.getModelsForProvider(m.mainProvider)
		if m.mainSelectedIdx > 0 {
			m.mainSelectedIdx--
		} else {
			m.mainSelectedIdx = len(models) - 1
			m.mainScrollOffset = max(0, len(models)-numVisibleModels)
		}

		// Keep selection visible
		if m.mainSelectedIdx < m.mainScrollOffset {
			m.mainScrollOffset = m.mainSelectedIdx
		}
	} else {
		models := m.getModelsForProvider(m.turboProvider)
		if m.turboSelectedIdx > 0 {
			m.turboSelectedIdx--
		} else {
			m.turboSelectedIdx = len(models) - 1
			m.turboScrollOffset = max(0, len(models)-numVisibleModels)
		}

		// Keep selection visible
		if m.turboSelectedIdx < m.turboScrollOffset {
			m.turboScrollOffset = m.turboSelectedIdx
		}
	}
}

func (m *modelDialog) moveSelectionDown() {
	if m.activePane == MainModelPane {
		models := m.getModelsForProvider(m.mainProvider)
		if m.mainSelectedIdx < len(models)-1 {
			m.mainSelectedIdx++
		} else {
			m.mainSelectedIdx = 0
			m.mainScrollOffset = 0
		}

		// Keep selection visible
		if m.mainSelectedIdx >= m.mainScrollOffset+numVisibleModels {
			m.mainScrollOffset = m.mainSelectedIdx - (numVisibleModels - 1)
		}
	} else {
		models := m.getModelsForProvider(m.turboProvider)
		if m.turboSelectedIdx < len(models)-1 {
			m.turboSelectedIdx++
		} else {
			m.turboSelectedIdx = 0
			m.turboScrollOffset = 0
		}

		// Keep selection visible
		if m.turboSelectedIdx >= m.turboScrollOffset+numVisibleModels {
			m.turboScrollOffset = m.turboSelectedIdx - (numVisibleModels - 1)
		}
	}
}

func (m *modelDialog) switchProvider(offset int) {
	newIdx := 0
	if m.activePane == MainModelPane {
		currentIdx := 0
		for i, p := range m.availableProviders {
			if p.Id == m.mainProvider.Id {
				currentIdx = i
				break
			}
		}
		newIdx = currentIdx + offset
		if newIdx < 0 {
			newIdx = len(m.availableProviders) - 1
		} else if newIdx >= len(m.availableProviders) {
			newIdx = 0
		}
		m.mainProvider = m.availableProviders[newIdx]
		m.mainSelectedIdx = 0
		m.mainScrollOffset = 0
		// Update modal title like the original when switching main provider
		m.modal.SetTitle(fmt.Sprintf("Select Models - %s", m.mainProvider.Name))
	} else {
		currentIdx := 0
		for i, p := range m.availableProviders {
			if p.Id == m.turboProvider.Id {
				currentIdx = i
				break
			}
		}
		newIdx = currentIdx + offset
		if newIdx < 0 {
			newIdx = len(m.availableProviders) - 1
		} else if newIdx >= len(m.availableProviders) {
			newIdx = 0
		}
		m.turboProvider = m.availableProviders[newIdx]
		m.turboSelectedIdx = 0
		m.turboScrollOffset = 0
	}
}

func (m *modelDialog) switchPane() {
	if m.activePane == MainModelPane {
		m.activePane = TurboModelPane
	} else {
		m.activePane = MainModelPane
	}
}

func (m *modelDialog) View() string {
	t := theme.CurrentTheme()

	// Handle empty providers case
	if len(m.availableProviders) == 0 {
		emptyStyle := lipgloss.NewStyle().
			Background(t.BackgroundElement()).
			Foreground(t.TextMuted()).
			Padding(2, 4).
			Align(lipgloss.Center)
		return emptyStyle.Render("No providers configured. Please configure at least one provider.")
	}

	// Base style for the content
	baseStyle := lipgloss.NewStyle().
		Background(t.BackgroundElement()).
		Foreground(t.Text())

	// Render main model pane
	mainPane := m.renderPane(
		"Main Model",
		m.mainProvider,
		m.mainSelectedIdx,
		m.mainScrollOffset,
		m.activePane == MainModelPane,
		baseStyle,
	)

	// Render turbo model pane
	turboPane := m.renderPane(
		"Turbo Model",
		m.turboProvider,
		m.turboSelectedIdx,
		m.turboScrollOffset,
		m.activePane == TurboModelPane,
		baseStyle,
	)

	// Create divider with background
	dividerHeight := 1 + numVisibleModels + 1 // 1 header + models + 1 scroll line
	dividerLines := make([]string, dividerHeight)
	for i := range dividerLines {
		dividerLines[i] = "│"
	}
	divider := lipgloss.NewStyle().
		Background(t.BackgroundElement()).
		Foreground(t.TextMuted()).
		Render(strings.Join(dividerLines, "\n"))

	// Join panes horizontally
	content := lipgloss.JoinHorizontal(
		lipgloss.Top,
		mainPane,
		divider,
		turboPane,
	)

	// Apply background to entire content area
	content = baseStyle.
		Width(totalDialogWidth).
		Height(dividerHeight).
		Render(content)

	// Scroll indicators like the original dialog
	scrollIndicator := m.getScrollIndicators(totalDialogWidth)

	// Final join with consistent background
	if scrollIndicator != "" {
		return baseStyle.
			Width(totalDialogWidth).
			Render(lipgloss.JoinVertical(
				lipgloss.Left,
				content,
				scrollIndicator,
			))
	}

	return content
}

func (m *modelDialog) renderPane(title string, provider client.ProviderInfo, selectedIdx, scrollOffset int, isActive bool, baseStyle lipgloss.Style) string {
	t := theme.CurrentTheme()

	// Simple header like in the original dialog
	headerText := fmt.Sprintf("%s (%s)", title, provider.Name)
	headerStyle := lipgloss.NewStyle().
		Width(paneWidth).
		Align(lipgloss.Center).
		Bold(true).
		Background(t.BackgroundElement())

	if isActive {
		headerStyle = headerStyle.Foreground(t.Primary())
	} else {
		headerStyle = headerStyle.Foreground(t.TextMuted())
	}

	headerRendered := headerStyle.Render(headerText)

	// Render models
	models := m.getModelsForProvider(provider)
	endIdx := min(scrollOffset+numVisibleModels, len(models))
	modelItems := make([]string, 0, endIdx-scrollOffset)

	for i := scrollOffset; i < endIdx; i++ {
		model := models[i]
		isTurbo := isTurboModel(model)

		// Build model display name
		modelName := model.Name
		if isTurbo {
			modelName = fmt.Sprintf("⚡ %s", modelName)
		}

		// Apply styling based on selection and pane state
		itemStyle := baseStyle.Width(paneWidth)
		if i == selectedIdx {
			if isActive {
				// Active selection - use primary color like the original dialog
				itemStyle = itemStyle.
					Background(t.Primary()).
					Foreground(t.BackgroundElement()).
					Bold(true)
			} else {
				// Inactive selection - use accent color to show selection
				itemStyle = itemStyle.
					Background(t.BackgroundElement()).
					Foreground(t.Accent()).
					Bold(true)
			}
		}

		modelItems = append(modelItems, itemStyle.Render(modelName))
	}

	// Pad to ensure consistent height
	for len(modelItems) < numVisibleModels {
		modelItems = append(modelItems, baseStyle.Width(paneWidth).Render(" "))
	}

	// Join all models
	modelList := lipgloss.JoinVertical(lipgloss.Left, modelItems...)

	// Scroll indicator content
	scrollIndicatorContent := ""
	if len(models) > numVisibleModels {
		if scrollOffset > 0 {
			scrollIndicatorContent = "↑"
		}
		if scrollOffset+numVisibleModels < len(models) {
			if scrollIndicatorContent != "" {
				scrollIndicatorContent += " "
			}
			scrollIndicatorContent += "↓"
		}
	}

	var scrollIndicator string
	if scrollIndicatorContent != "" {
		scrollIndicator = lipgloss.NewStyle().
			Background(t.BackgroundElement()).
			Foreground(t.Primary()).
			Width(paneWidth).
			Align(lipgloss.Center).
			Render(scrollIndicatorContent)
	} else {
		scrollIndicator = baseStyle.Width(paneWidth).Render(" ")
	}

	// Combine all parts
	return lipgloss.JoinVertical(
		lipgloss.Left,
		headerRendered,
		modelList,
		scrollIndicator,
	)
}

func (m *modelDialog) getScrollIndicators(maxWidth int) string {
	t := theme.CurrentTheme()

	var indicator string

	// Check if main models have scroll
	mainModels := len(m.mainProvider.Models)
	if mainModels > numVisibleModels {
		if m.mainScrollOffset > 0 {
			indicator += "↑ "
		}
		if m.mainScrollOffset+numVisibleModels < mainModels {
			indicator += "↓ "
		}
	}

	// Add horizontal scroll indicators
	if m.hScrollPossible {
		indicator = "← " + indicator + "→"
	}

	// Add tab hint
	if indicator != "" {
		indicator += " • [Tab] Switch pane"
	}

	if indicator == "" {
		return lipgloss.NewStyle().
			Background(t.BackgroundElement()).
			Width(maxWidth).
			Render(" ")
	}

	return lipgloss.NewStyle().
		Width(maxWidth).
		Align(lipgloss.Center).
		Foreground(t.TextMuted()).
		Background(t.BackgroundElement()).
		Render(indicator)
}

func isTurboModel(model client.ModelInfo) bool {
	// Models that are good for turbo tasks
	turboModels := []string{
		"gpt-3.5-turbo",
		"gpt-4o-mini",
		"claude-3-haiku",
		"gemini-1.5-flash",
		"llama-3.2",
		"deepseek-chat",
	}

	modelLower := strings.ToLower(model.Id)
	for _, lm := range turboModels {
		if strings.Contains(modelLower, lm) {
			return true
		}
	}
	return false
}

func (m *modelDialog) Render(background string) string {
	if m.modal != nil {
		return m.modal.Render(m.View(), background)
	}
	return ""
}

func (m *modelDialog) IsVisible() bool {
	return m.modal != nil
}

func (m *modelDialog) Close() tea.Cmd {
	return util.CmdHandler(modal.CloseModalMsg{})
}

// NewModelDialog creates a new model selection dialog
func NewModelDialog(app *app.App) ModelDialog {
	availableProviders, _ := app.ListProviders(context.Background())

	if len(availableProviders) == 0 {
		return &modelDialog{
			app:                app,
			availableProviders: availableProviders,
			hScrollPossible:    false,
			modal:              modal.New(modal.WithTitle("Select Models - No Providers Available")),
		}
	}

	// Set up initial providers
	mainProvider := availableProviders[0]
	turboProvider := availableProviders[0]

	dialog := &modelDialog{
		app:                app,
		availableProviders: availableProviders,
		mainProvider:       mainProvider,
		turboProvider:      turboProvider,
		hScrollPossible:    len(availableProviders) > 1,
		activePane:         MainModelPane,
		modal: modal.New(
			modal.WithTitle(fmt.Sprintf("Select Models - %s", mainProvider.Name)),
		),
	}

	// Initialize will set up the selections based on current models
	dialog.Init()

	return dialog
}

// UpdateModelContext updates the context with selected models
func UpdateModelContext(ctx context.Context, mainProvider client.ProviderInfo, mainModel client.ModelInfo, turboProvider client.ProviderInfo, turboModel client.ModelInfo) context.Context {
	ctx = context.WithValue(ctx, "main_provider", mainProvider)
	ctx = context.WithValue(ctx, "main_model", mainModel)
	ctx = context.WithValue(ctx, "turbo_provider", turboProvider)
	ctx = context.WithValue(ctx, "turbo_model", turboModel)
	return ctx
}

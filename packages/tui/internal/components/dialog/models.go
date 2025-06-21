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
	LightweightModelPane
)

// ModelDialog interface for the model selection dialog
type ModelDialog interface {
	layout.Modal
}

type modelDialog struct {
	app                *app.App
	availableProviders []client.ProviderInfo
	
	// Main model selection
	mainProvider      client.ProviderInfo
	mainSelectedIdx   int
	mainScrollOffset  int
	
	// Lightweight model selection
	lightProvider      client.ProviderInfo
	lightSelectedIdx   int
	lightScrollOffset  int
	
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

	// Initialize lightweight provider and model
	m.lightProvider = m.mainProvider // Default to same as main

	if m.app.LightProvider != nil && m.app.LightModel != nil {
		m.lightProvider = *m.app.LightProvider

		models := m.getModelsForProvider(m.lightProvider)
		for i, model := range models {
			if model.Id == m.app.LightModel.Id {
				m.lightSelectedIdx = i
				// Adjust scroll position to keep selected model visible
				if m.lightSelectedIdx >= numVisibleModels {
					m.lightScrollOffset = m.lightSelectedIdx - (numVisibleModels - 1)
				}
				break
			}
		}
	} else {
		// If no lightweight model is set, try to select a lightweight model by default
		models := m.getModelsForProvider(m.lightProvider)
		for i, model := range models {
			if isLightweightModel(model) {
				m.lightSelectedIdx = i
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
			lightModels := m.getModelsForProvider(m.lightProvider)
			
			if len(mainModels) == 0 || len(lightModels) == 0 {
				return m, nil
			}
			
			mainSelectedModel := mainModels[m.mainSelectedIdx]
			lightSelectedModel := lightModels[m.lightSelectedIdx]
			
			return m, tea.Sequence(
				util.CmdHandler(modal.CloseModalMsg{}),
				util.CmdHandler(
					app.ModelSelectedMsg{
						MainProvider:        m.mainProvider,
						MainModel:           mainSelectedModel,
						LightweightProvider: m.lightProvider,
						LightweightModel:    lightSelectedModel,
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
		models := m.getModelsForProvider(m.lightProvider)
		if m.lightSelectedIdx > 0 {
			m.lightSelectedIdx--
		} else {
			m.lightSelectedIdx = len(models) - 1
			m.lightScrollOffset = max(0, len(models)-numVisibleModels)
		}
		
		// Keep selection visible
		if m.lightSelectedIdx < m.lightScrollOffset {
			m.lightScrollOffset = m.lightSelectedIdx
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
		models := m.getModelsForProvider(m.lightProvider)
		if m.lightSelectedIdx < len(models)-1 {
			m.lightSelectedIdx++
		} else {
			m.lightSelectedIdx = 0
			m.lightScrollOffset = 0
		}
		
		// Keep selection visible
		if m.lightSelectedIdx >= m.lightScrollOffset+numVisibleModels {
			m.lightScrollOffset = m.lightSelectedIdx - (numVisibleModels - 1)
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
			if p.Id == m.lightProvider.Id {
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
		m.lightProvider = m.availableProviders[newIdx]
		m.lightSelectedIdx = 0
		m.lightScrollOffset = 0
	}
}

func (m *modelDialog) switchPane() {
	if m.activePane == MainModelPane {
		m.activePane = LightweightModelPane
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

	// Render lightweight model pane
	lightPane := m.renderPane(
		"Lightweight Model",
		m.lightProvider,
		m.lightSelectedIdx,
		m.lightScrollOffset,
		m.activePane == LightweightModelPane,
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
		lightPane,
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
		isLightweight := isLightweightModel(model)

		// Build model display name
		modelName := model.Name
		if isLightweight {
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

func isLightweightModel(model client.ModelInfo) bool {
	// Models that are good for lightweight tasks
	lightweightModels := []string{
		"gpt-3.5-turbo",
		"gpt-4o-mini",
		"claude-3-haiku",
		"gemini-1.5-flash",
		"llama-3.2",
		"deepseek-chat",
	}
	
	modelLower := strings.ToLower(model.Id)
	for _, lm := range lightweightModels {
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
	lightProvider := availableProviders[0]
	
	dialog := &modelDialog{
		app:                app,
		availableProviders: availableProviders,
		mainProvider:       mainProvider,
		lightProvider:      lightProvider,
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
func UpdateModelContext(ctx context.Context, mainProvider client.ProviderInfo, mainModel client.ModelInfo, lightProvider client.ProviderInfo, lightModel client.ModelInfo) context.Context {
	ctx = context.WithValue(ctx, "main_provider", mainProvider)
	ctx = context.WithValue(ctx, "main_model", mainModel)
	ctx = context.WithValue(ctx, "light_provider", lightProvider)
	ctx = context.WithValue(ctx, "light_model", lightModel)
	return ctx
}
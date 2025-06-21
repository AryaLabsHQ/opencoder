package dialog

import (
	"context"
	"slices"
	"strings"

	"github.com/charmbracelet/bubbles/v2/key"
	tea "github.com/charmbracelet/bubbletea/v2"
	"github.com/charmbracelet/lipgloss/v2"
	"github.com/sst/opencode/internal/app"
	"github.com/sst/opencode/internal/components/list"
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
	maxDialogWidth   = 60
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
	mainProvider    client.ProviderInfo
	mainModelList   list.List[list.StringItem]
	mainHScrollOffset int

	// Lightweight model selection
	lightProvider    client.ProviderInfo
	lightModelList   list.List[list.StringItem]
	lightHScrollOffset int

	// UI state
	activePane      ActivePane
	width           int
	height          int
	hScrollPossible bool

	modal *modal.Modal
}

type modelKeyMap struct {
	Left   key.Binding
	Right  key.Binding
	Tab    key.Binding
	Enter  key.Binding
	Escape key.Binding
}

var modelKeys = modelKeyMap{
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
	m.setupModelsForProvider(m.mainProvider.Id, MainModelPane)
	m.setupModelsForProvider(m.lightProvider.Id, LightweightModelPane)
	return nil
}

func (m *modelDialog) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch {
		case key.Matches(msg, modelKeys.Left):
			if m.hScrollPossible {
				m.switchProvider(-1)
			}
			return m, nil
		case key.Matches(msg, modelKeys.Right):
			if m.hScrollPossible {
				m.switchProvider(1)
			}
			return m, nil
		case key.Matches(msg, modelKeys.Tab):
			// Switch between main and lightweight model panes
			if m.activePane == MainModelPane {
				m.activePane = LightweightModelPane
			} else {
				m.activePane = MainModelPane
			}
			return m, nil
		case key.Matches(msg, modelKeys.Enter):
			// Get selected models from both panes
			mainSelectedItem, _ := m.mainModelList.GetSelectedItem()
			lightSelectedItem, _ := m.lightModelList.GetSelectedItem()
			
			mainModels := m.modelsForProvider(m.mainProvider)
			lightModels := m.modelsForProvider(m.lightProvider)
			
			var mainSelectedModel, lightSelectedModel client.ModelInfo
			
			// Find main model
			for _, model := range mainModels {
				if model.Name == string(mainSelectedItem) {
					mainSelectedModel = model
					break
				}
			}
			
			// Find lightweight model
			for _, model := range lightModels {
				if model.Name == string(lightSelectedItem) {
					lightSelectedModel = model
					break
				}
			}
			
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

	// Update the active list component
	if m.activePane == MainModelPane {
		updatedList, cmd := m.mainModelList.Update(msg)
		m.mainModelList = updatedList.(list.List[list.StringItem])
		return m, cmd
	} else {
		updatedList, cmd := m.lightModelList.Update(msg)
		m.lightModelList = updatedList.(list.List[list.StringItem])
		return m, cmd
	}
}

func (m *modelDialog) modelsForProvider(provider client.ProviderInfo) []client.ModelInfo {
	var models []client.ModelInfo
	for _, model := range provider.Models {
		models = append(models, model)
	}
	slices.SortFunc(models, func(a, b client.ModelInfo) int {
		return strings.Compare(a.Name, b.Name)
	})
	return models
}

func (m *modelDialog) switchProvider(offset int) {
	if m.activePane == MainModelPane {
		newOffset := m.mainHScrollOffset + offset
		if newOffset < 0 {
			newOffset = len(m.availableProviders) - 1
		} else if newOffset >= len(m.availableProviders) {
			newOffset = 0
		}
		m.mainHScrollOffset = newOffset
		m.mainProvider = m.availableProviders[newOffset]
		m.setupModelsForProvider(m.mainProvider.Id, MainModelPane)
	} else {
		newOffset := m.lightHScrollOffset + offset
		if newOffset < 0 {
			newOffset = len(m.availableProviders) - 1
		} else if newOffset >= len(m.availableProviders) {
			newOffset = 0
		}
		m.lightHScrollOffset = newOffset
		m.lightProvider = m.availableProviders[newOffset]
		m.setupModelsForProvider(m.lightProvider.Id, LightweightModelPane)
	}
}

func (m *modelDialog) setupModelsForProvider(providerId string, pane ActivePane) {
	var provider client.ProviderInfo
	for _, p := range m.availableProviders {
		if p.Id == providerId {
			provider = p
			break
		}
	}
	
	models := m.modelsForProvider(provider)
	modelNames := make([]string, len(models))
	for i, model := range models {
		modelNames[i] = model.Name
	}

	newList := list.NewStringList(modelNames, numVisibleModels, "No models available", true)
	newList.SetMaxWidth(paneWidth - 2)
	
	if pane == MainModelPane {
		m.mainModelList = newList
		m.mainProvider = provider
		
		// Try to select the current model if it exists
		if m.app.MainModel != nil {
			for _, model := range models {
				if model.Id == m.app.MainModel.Id {
					// The list component doesn't expose SetSelectedIdx, so we'll rely on it being set during creation
					break
				}
			}
		}
	} else {
		m.lightModelList = newList
		m.lightProvider = provider
		
		// Try to select the current lightweight model if it exists
		if m.app.LightModel != nil {
			for _, model := range models {
				if model.Id == m.app.LightModel.Id {
					// The list component doesn't expose SetSelectedIdx, so we'll rely on it being set during creation
					break
				}
			}
		}
	}
}

func (m *modelDialog) Render(background string) string {
	if m.modal != nil {
		var mainPane, lightPane string
		
		// Main model pane
		mainPaneStyle := lipgloss.NewStyle().
			Width(paneWidth).
			Height(m.height - 10).
			Padding(1).
			Border(lipgloss.RoundedBorder())
		
		t := theme.CurrentTheme()
		if m.activePane == MainModelPane {
			mainPaneStyle = mainPaneStyle.BorderForeground(t.Primary())
		} else {
			mainPaneStyle = mainPaneStyle.BorderForeground(t.Border())
		}
		
		mainTitle := lipgloss.NewStyle().
			Bold(true).
			Foreground(t.Primary()).
			Render("Main Model")
		
		mainProviderName := lipgloss.NewStyle().
			Foreground(t.Secondary()).
			Render(m.mainProvider.Name)
		
		mainPane = mainPaneStyle.Render(
			lipgloss.JoinVertical(lipgloss.Left,
				mainTitle,
				mainProviderName,
				"",
				m.mainModelList.View(),
			),
		)
		
		// Lightweight model pane
		lightPaneStyle := lipgloss.NewStyle().
			Width(paneWidth).
			Height(m.height - 10).
			Padding(1).
			Border(lipgloss.RoundedBorder())
		
		if m.activePane == LightweightModelPane {
			lightPaneStyle = lightPaneStyle.BorderForeground(t.Primary())
		} else {
			lightPaneStyle = lightPaneStyle.BorderForeground(t.Border())
		}
		
		lightTitle := lipgloss.NewStyle().
			Bold(true).
			Foreground(t.Primary()).
			Render("Lightweight Model")
		
		lightProviderName := lipgloss.NewStyle().
			Foreground(t.Secondary()).
			Render(m.lightProvider.Name)
		
		lightPane = lightPaneStyle.Render(
			lipgloss.JoinVertical(lipgloss.Left,
				lightTitle,
				lightProviderName,
				"",
				m.lightModelList.View(),
			),
		)
		
		// Combine panes
		content := lipgloss.JoinHorizontal(lipgloss.Top, mainPane, " ", lightPane)
		
		// Add help text
		helpText := lipgloss.NewStyle().
			Foreground(t.Secondary()).
			Render("tab: switch pane • ←/→: change provider • ↑/↓: select model • enter: save • esc: cancel")
		
		fullContent := lipgloss.JoinVertical(lipgloss.Center, content, "", helpText)
		
		return m.modal.Render(fullContent, background)
	}
	return ""
}

func (m *modelDialog) View() string {
	return m.Render("")
}

func (m *modelDialog) IsVisible() bool {
	return m.modal != nil
}

func (m *modelDialog) Close() tea.Cmd {
	return util.CmdHandler(modal.CloseModalMsg{})
}

// NewModelDialog creates a new model selection dialog
func NewModelDialog(app *app.App) ModelDialog {
	availableProviders := getEnabledProviders(app)
	
	// Set up main model provider
	mainProvider := availableProviders[0]
	if app.MainProvider != nil {
		for _, p := range availableProviders {
			if p.Id == app.MainProvider.Id {
				mainProvider = p
				break
			}
		}
	}
	
	// Set up lightweight model provider (default to same as main if not set)
	lightProvider := mainProvider
	if app.LightProvider != nil {
		for _, p := range availableProviders {
			if p.Id == app.LightProvider.Id {
				lightProvider = p
				break
			}
		}
	}
	
	dialog := &modelDialog{
		app:                app,
		availableProviders: availableProviders,
		mainProvider:       mainProvider,
		lightProvider:      lightProvider,
		hScrollPossible:    len(availableProviders) > 1,
		activePane:         MainModelPane,
		modal: modal.New(
			modal.WithTitle("Select Models"),
			modal.WithMaxWidth(totalDialogWidth+4),
		),
	}
	
	// Find initial scroll offsets
	for i, p := range availableProviders {
		if p.Id == mainProvider.Id {
			dialog.mainHScrollOffset = i
		}
		if p.Id == lightProvider.Id {
			dialog.lightHScrollOffset = i
		}
	}
	
	return dialog
}

func getEnabledProviders(app *app.App) []client.ProviderInfo {
	// Get providers from the API
	ctx := context.Background()
	providersResponse, err := app.Client.PostProviderListWithResponse(ctx)
	if err != nil || providersResponse == nil || providersResponse.StatusCode() != 200 {
		// Return empty list if we can't get providers
		return []client.ProviderInfo{}
	}

	var enabledProviders []client.ProviderInfo
	
	// Get all providers that have models
	for _, provider := range providersResponse.JSON200.Providers {
		if len(provider.Models) > 0 {
			enabledProviders = append(enabledProviders, provider)
		}
	}

	// Sort providers by name
	slices.SortFunc(enabledProviders, func(a, b client.ProviderInfo) int {
		return strings.Compare(a.Name, b.Name)
	})

	return enabledProviders
}

// UpdateModelContext updates the context with selected models
func UpdateModelContext(ctx context.Context, mainProvider client.ProviderInfo, mainModel client.ModelInfo, lightProvider client.ProviderInfo, lightModel client.ModelInfo) context.Context {
	ctx = context.WithValue(ctx, "main_provider", mainProvider)
	ctx = context.WithValue(ctx, "main_model", mainModel)
	ctx = context.WithValue(ctx, "light_provider", lightProvider)
	ctx = context.WithValue(ctx, "light_model", lightModel)
	return ctx
}
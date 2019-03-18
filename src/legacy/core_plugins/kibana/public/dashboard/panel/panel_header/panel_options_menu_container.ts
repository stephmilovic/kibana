/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { EuiContextMenuPanelDescriptor } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { connect } from 'react-redux';
import {
  buildEuiContextMenuPanels,
  ContextMenuAction,
  ContextMenuPanel,
  getTrigger,
} from 'ui/embeddable';
import { panelActionsStore } from '../../store/panel_actions_store';

import {
  getEditPanelAction,
  getInspectorPanelAction,
  getRemovePanelAction,
  getToggleExpandPanelAction,
} from './panel_actions';
import { PanelOptionsMenu, PanelOptionsMenuProps } from './panel_options_menu';

import {
  closeContextMenu,
  deletePanel,
  maximizePanel,
  minimizePanel,
  resetPanelTitle,
  setPanelTitle,
  setVisibleContextMenuPanelId,
} from '../../actions';

import { Dispatch } from 'redux';
import { AnyAction, SHOW_EDIT_MODE_TRIGGER, SHOW_VIEW_MODE_TRIGGER } from 'ui/embeddable';
import { CoreKibanaState } from '../../../selectors';
import { DashboardViewMode } from '../../dashboard_view_mode';
import {
  DashboardContainer,
  DashboardEmbeddable,
  DashboardEmbeddableInput,
} from '../../embeddables/dashboard_container';
import {
  getContainerState,
  getEmbeddable,
  getEmbeddableEditUrl,
  getEmbeddableTitle,
  getMaximizedPanelId,
  getPanel,
  getViewMode,
  getVisibleContextMenuPanelId,
  PanelId,
} from '../../selectors';

interface PanelOptionsMenuContainerDispatchProps {
  onDeletePanel: () => void;
  onCloseContextMenu: () => void;
  openContextMenu: () => void;
  onMaximizePanel: () => void;
  onMinimizePanel: () => void;
  onResetPanelTitle: () => void;
  onUpdatePanelTitle: (title: string) => void;
}

interface PanelOptionsMenuContainerOwnProps {
  panelId: PanelId;
  embeddable: DashboardEmbeddable;
  container: DashboardContainer;
}
interface PanelOptionsMenuContainerStateProps {
  panelTitle?: string;
  editUrl: string | null | undefined;
  isExpanded: boolean;
  containerState: DashboardEmbeddableInput;
  visibleContextMenuPanelId: PanelId | undefined;
  isViewMode: boolean;
}

const mapStateToProps = (
  { dashboard }: CoreKibanaState,
  { panelId }: PanelOptionsMenuContainerOwnProps
) => {
  const embeddable = getEmbeddable(dashboard, panelId);
  const panel = getPanel(dashboard, panelId);
  const embeddableTitle = getEmbeddableTitle(dashboard, panelId);
  const containerState = getContainerState(dashboard, panelId);
  const visibleContextMenuPanelId = getVisibleContextMenuPanelId(dashboard);
  const viewMode = getViewMode(dashboard);
  return {
    panelTitle: panel.title === undefined ? embeddableTitle : panel.title,
    editUrl: embeddable ? getEmbeddableEditUrl(dashboard, panelId) : null,
    isExpanded: getMaximizedPanelId(dashboard) === panelId,
    containerState,
    visibleContextMenuPanelId,
    isViewMode: viewMode === DashboardViewMode.VIEW,
  };
};

/**
 * @param dispatch {Function}
 * @param embeddableFactory {EmbeddableFactory}
 * @param panelId {string}
 */
const mapDispatchToProps = (
  dispatch: Dispatch,
  { panelId }: PanelOptionsMenuContainerOwnProps
) => ({
  onDeletePanel: () => {
    dispatch(deletePanel(panelId));
  },
  onCloseContextMenu: () => dispatch(closeContextMenu()),
  openContextMenu: () => dispatch(setVisibleContextMenuPanelId(panelId)),
  onMaximizePanel: () => dispatch(maximizePanel(panelId)),
  onMinimizePanel: () => dispatch(minimizePanel()),
  onResetPanelTitle: () => dispatch(resetPanelTitle(panelId)),
  onUpdatePanelTitle: (newTitle: string) => dispatch(setPanelTitle({ title: newTitle, panelId })),
});

const mergeProps = (
  stateProps: PanelOptionsMenuContainerStateProps,
  dispatchProps: PanelOptionsMenuContainerDispatchProps,
  ownProps: PanelOptionsMenuContainerOwnProps
) => {
  const {
    isExpanded,
    panelTitle,
    containerState,
    visibleContextMenuPanelId,
    isViewMode,
  } = stateProps;
  const isPopoverOpen = visibleContextMenuPanelId === ownProps.panelId;
  const {
    onMaximizePanel,
    onMinimizePanel,
    onDeletePanel,
    onResetPanelTitle,
    onUpdatePanelTitle,
    onCloseContextMenu,
    openContextMenu,
  } = dispatchProps;
  // Outside click handlers will trigger for every closed context menu, we only want to react to clicks external to
  // the currently opened menu.
  const closeMyContextMenuPanel = () => {
    if (isPopoverOpen) {
      onCloseContextMenu();
    }
  };
  let getPanels: () => Promise<EuiContextMenuPanelDescriptor[]> = () => Promise.resolve([]);
  // Don't build the panels if the pop over is not open, or this gets expensive - this function is called once for
  // every panel, every time any state changes.
  if (isPopoverOpen) {
    const contextMenuPanel = new ContextMenuPanel({
      title: i18n.translate('kbn.dashboard.panel.optionsMenu.optionsContextMenuTitle', {
        defaultMessage: 'Options',
      }),
      id: 'mainMenu',
    });

    const triggerId =
      ownProps.container.getOutput().view.viewMode === DashboardViewMode.EDIT
        ? SHOW_EDIT_MODE_TRIGGER
        : SHOW_VIEW_MODE_TRIGGER;

    getPanels = async () => {
      const toggleExpandedPanel = () => {
        isExpanded ? onMinimizePanel() : onMaximizePanel();
        closeMyContextMenuPanel();
      };

      let panels: EuiContextMenuPanelDescriptor[] = [];

      const trigger = await getTrigger(triggerId);
      const actions = trigger.getCompatibleActions({
        embeddable: ownProps.embeddable,
        container: ownProps.container,
      });

      const wrappedForContextMenu = actions.map((action: AnyAction) => {
        if (action.id) {
          return new ContextMenuAction(
            {
              id: action.id,
              displayName: action.title,
              parentPanelId: 'mainMenu',
            },
            {
              onClick: ({ embeddable, container }) => action.execute({ embeddable, container }),
            }
          );
        }
      });

      const contextMenuActions = [
        //   getInspectorPanelAction({
        //     closeContextMenu: closeMyContextMenuPanel,
        //     panelTitle,
        //   }),
        //  // getEditPanelAction(),
        getToggleExpandPanelAction({ isExpanded, toggleExpandedPanel }),
        getRemovePanelAction(onDeletePanel),
      ]
        .concat(panelActionsStore.actions)
        .concat(wrappedForContextMenu);

      panels = buildEuiContextMenuPanels<DashboardEmbeddable, DashboardContainer>({
        contextMenuPanel,
        actions: contextMenuActions,
        embeddable: ownProps.embeddable,
        container: ownProps.container,
      });
      return panels;
    };
  }

  const toggleContextMenu = () => (isPopoverOpen ? onCloseContextMenu() : openContextMenu());
  return {
    getPanels,
    toggleContextMenu,
    closeContextMenu: closeMyContextMenuPanel,
    isPopoverOpen,
    isViewMode,
    container: ownProps.container,
  };
};

export const PanelOptionsMenuContainer = connect<
  PanelOptionsMenuContainerStateProps,
  PanelOptionsMenuContainerDispatchProps,
  PanelOptionsMenuContainerOwnProps,
  PanelOptionsMenuProps,
  CoreKibanaState
>(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(PanelOptionsMenu);

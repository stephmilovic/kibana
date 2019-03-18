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
import React from 'react';
import { openContextMenu } from 'ui/context_menu';
import { AnyAction, Container } from 'ui/embeddable';
import { AnyContainer } from 'ui/embeddable/containers';
import {
  buildEuiContextMenuPanels,
  ContextMenuAction,
  ContextMenuPanel,
} from 'ui/embeddable/context_menu_actions';
import { AnyEmbeddable, Embeddable } from 'ui/embeddable/embeddables';
import {
  TriggerSavedObject,
  TriggerSavedObjectAttributes,
} from 'ui/embeddable/triggers/trigger_saved_object';

function isTriggerSavedObject(
  triggerSavedObject: TriggerSavedObject | { id: string; title: string }
): triggerSavedObject is TriggerSavedObject {
  return (triggerSavedObject as TriggerSavedObject).attributes !== undefined;
}
export class Trigger {
  public id: string;
  public description: string = '';
  public embeddableId: string = '';
  public embeddableType: string = '';
  public title: string;
  private actions: AnyAction[] = [];

  constructor(triggerSavedObject: TriggerSavedObject | { id: string; title: string }) {
    this.id = triggerSavedObject.id;

    if (isTriggerSavedObject(triggerSavedObject)) {
      this.title = triggerSavedObject.attributes.title;
      this.description = triggerSavedObject.attributes.description;
      this.embeddableId = triggerSavedObject.attributes.embeddableId;
      this.embeddableType = triggerSavedObject.attributes.embeddableType;
    } else {
      this.title = triggerSavedObject.title;
    }
  }

  public getCompatibleActions<EI, EO, CI, CO>({
    embeddable,
    container,
  }: {
    embeddable: Embeddable<EI, EO>;
    container: Container<CI, CO, EI>;
  }) {
    return this.actions.filter(action => {
      let remove = false;
      if (embeddable) {
        if (action.embeddableId !== '') {
          remove = action.embeddableId !== '' && action.embeddableId !== embeddable.id;
        } else if (action.embeddableType !== '') {
          remove = action.embeddableType !== '' && action.embeddableType !== embeddable.type;
        } else {
          remove = false;
        }
      }
      return !remove;
    });
  }

  public execute({
    embeddable,
    container,
    triggerContext,
  }: {
    embeddable: Embeddable<any, any>;
    container: Container<any, any, any>;
    triggerContext: any;
  }) {
    const actions = this.getCompatibleActions({ embeddable, container, triggerContext });
    if (actions.length > 1) {
      const contextMenuPanel = new ContextMenuPanel({
        title: 'Actions',
        id: 'mainMenu',
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
              onClick: () => action.execute({ embeddable, container, triggerContext }),
            }
          );
        }
      });
      const panels = buildEuiContextMenuPanels<AnyEmbeddable, AnyContainer>({
        contextMenuPanel,
        actions: wrappedForContextMenu,
        embeddable,
        container,
      });

      openContextMenu(panels);
    } else if (actions.length === 1) {
      actions[0].execute({ embeddable, container, triggerContext });
    }
  }

  public addAction(action: AnyAction) {
    this.actions.push(action);
  }

  public getActions() {
    return this.actions;
  }

  public containsAction(id: string) {
    return !!this.actions.find(action => action.id === id);
  }

  public removeAction(actionId: string) {
    this.actions = this.actions.filter(action => action.id !== actionId);
  }

  public getSavedObjectAttributes(): TriggerSavedObjectAttributes {
    return {
      title: this.title,
      description: this.description,
      embeddableId: this.embeddableId,
      embeddableType: this.embeddableType,
      actions: this.actions.map(action => action.id).join(';'),
    };
  }
}

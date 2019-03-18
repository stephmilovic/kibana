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

import { addTrigger, EmbeddableFactoriesRegistryProvider, Trigger } from 'ui/embeddable';
import { embeddableFactories } from 'ui/embeddable/embeddables/embeddable_factories_registry';
import 'ui/pager/pager_factory';
import { IPrivate } from 'ui/private';
import '../saved_searches';
import { SavedSearchLoader } from '../types';
import { SEARCH_EMBEDDABLE_TYPE, SearchEmbeddableFactory } from './search_embeddable_factory';

export function searchEmbeddableFactoryProvider(Private: IPrivate) {
  const SearchEmbeddableFactoryProvider = (
    $compile: ng.ICompileService,
    $rootScope: ng.IRootScopeService,
    savedSearches: SavedSearchLoader
  ) => {
    const searchF = new SearchEmbeddableFactory($compile, $rootScope, savedSearches);
    embeddableFactories.registerFactory(searchF);
    return searchF;
  };
  return Private(SearchEmbeddableFactoryProvider);
}

EmbeddableFactoriesRegistryProvider.register(searchEmbeddableFactoryProvider);

export const SEARCH_ROW_CLICK_TRIGGER = 'SEARCH_ROW_CLICK_TRIGGER';

try {
  const rowClickTrigger = new Trigger({ id: SEARCH_ROW_CLICK_TRIGGER, title: 'On row click' });
  rowClickTrigger.embeddableType = SEARCH_EMBEDDABLE_TYPE;
  addTrigger(rowClickTrigger);
} catch (e) {
  console.log(e);
}

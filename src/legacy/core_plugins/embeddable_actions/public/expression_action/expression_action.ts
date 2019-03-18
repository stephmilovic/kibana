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

import { Action, ActionSavedObject } from 'ui/embeddable/actions';

// @ts-ignore
import { fromExpression } from '@kbn/interpreter/common';
import { AnyEmbeddable } from 'ui/embeddable';
// @ts-ignore
import { interpretAst } from '../../../interpreter/public/interpreter';
import { EXPRESSION_ACTION } from './expression_action_factory';

export class ExpressionAction extends Action<any, any, any> {
  public expression: string;
  constructor(actionSavedObject?: ActionSavedObject) {
    super({
      actionSavedObject,
      type: EXPRESSION_ACTION,
    });
    this.expression = actionSavedObject ? actionSavedObject.attributes.configuration : '';
  }

  public isCompatible() {
    return Promise.resolve(true);
  }

  public updateConfiguration(config: string) {
    this.expression = config;
  }

  public execute({ embeddable }: { embeddable: AnyEmbeddable }) {
    const expressionWithParameters = this.injectTemplateParameters(this.expression, embeddable);
    const ast = fromExpression(expressionWithParameters);
    interpretAst(ast, {});
  }

  public getConfiguration() {
    return this.expression;
  }
}

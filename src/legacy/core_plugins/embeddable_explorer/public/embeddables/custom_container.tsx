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
import React, { ReactNode } from 'react';
import ReactDOM from 'react-dom';
import { Container, Embeddable, TimeRange } from 'ui/embeddable';
import { ErrorEmbeddable } from 'ui/embeddable/embeddables/error_embeddable';
import { NotebookDisplay } from './notebook_display';

export interface EmbeddableInput {
  timeRange: TimeRange;
}

export class CustomContainer extends Container<{}, {}, EmbeddableInput> {
  private embeddable1: Embeddable<EmbeddableInput, any> | ErrorEmbeddable | undefined;
  private embeddable2: Embeddable<EmbeddableInput, any> | ErrorEmbeddable | undefined;

  constructor() {
    super({ id: '123', type: 'customContainer' }, {}, {});
  }

  public setEmbeddables(
    embeddable1: Embeddable<EmbeddableInput, any> | ErrorEmbeddable,
    embeddable2: Embeddable<EmbeddableInput, any> | ErrorEmbeddable
  ) {
    this.embeddable1 = embeddable1;
    this.embeddable2 = embeddable2;

    this.embeddable1.onInputChanged(this.getInputForEmbeddable(this.embeddable1.id));
    this.embeddable2.onInputChanged(this.getInputForEmbeddable(this.embeddable2.id));
  }

  public render(dom: ReactNode) {
    if (this.embeddable1 && this.embeddable2) {
      ReactDOM.render(
        // @ts-ignore
        <NotebookDisplay embeddable1={this.embeddable1} embeddable2={this.embeddable2} />,
        dom
      );
    } else {
      new ErrorEmbeddable("You didn't give me embeddables!").render(dom);
    }
  }

  public getInputForEmbeddable(embeddableId: string): EmbeddableInput {
    return {
      timeRange: { from: 'now-7d', to: 'now' },
    };
  }
}

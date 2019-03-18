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
import { ReactNode } from 'react';
import { BehaviorSubject } from 'rxjs';
import { Container } from 'ui/embeddable/containers';
import { EmbeddableFactory, OutputSpec } from 'ui/embeddable/embeddables/embeddable_factory';
import { Trigger } from 'ui/embeddable/triggers';
import { Adapters } from 'ui/inspector';

interface EmbeddableConfiguration<I, O> {
  id: string;
  type: string;
  factory: EmbeddableFactory<I, O>;
}

export type AnyEmbeddable = Embeddable<any, any>;

export abstract class Embeddable<I, O> {
  public readonly type: string;
  public readonly id: string;
  public container?: Container<any, any, I>;
  protected output: O;
  protected input: I;
  protected factory: EmbeddableFactory<I, O>;
  protected changeListeners: Array<(output: O) => void> = [];

  constructor(
    { type, id, factory }: EmbeddableConfiguration<I, O>,
    initialOutput: O,
    initialInput: I
  ) {
    this.type = type;
    this.id = id;
    this.output = initialOutput;
    this.input = initialInput;
    this.factory = factory;
  }

  public getFactory() {
    return this.factory;
  }

  public setContainer(container: Container<any, any, I>) {
    this.container = container;
  }

  public onInputChanged(input: I): void {
    this.input = input;
  }

  public getOutput(): Readonly<O> {
    return this.output;
  }

  public getInput(): Readonly<I> {
    return this.input;
  }

  public getOutputSpec(trigger?: Trigger): OutputSpec {
    return {};
  }

  public onOutputChanged(listener: (output: O) => void) {
    this.changeListeners.push(listener);
  }

  public emitOutputChanged(output: O) {
    if (!_.isEqual(this.output, output)) {
      this.output = output;
      this.changeListeners.forEach(listener => listener(this.output));
    }
  }

  public supportsTrigger(trigger: Trigger) {
    return false;
  }

  /**
   * Embeddable should render itself at the given domNode.
   */
  public abstract render(domNode: HTMLElement | ReactNode): void;

  /**
   * An embeddable can return inspector adapters if it want the inspector to be
   * available via the context menu of that panel.
   * @return Inspector adapters that will be used to open an inspector for.
   */
  public getInspectorAdapters(): Adapters | undefined {
    return undefined;
  }

  public destroy(): void {
    return;
  }

  public reload(): void {
    return;
  }
}

# kbn-markdown

Kibana flavored markdown plugins to use with the EuiMarkdown component within Kibana.

Example use:

```react
import { lensMarkdownPlugin } from '@kbn-markdown';

export const MyMarkdown = () => {
  const { savedObjects } = useKibana().services;
  const LensComponent = kibana?.services?.lens?.EmbeddableComponent!;
  const uiPlugins = getDefaultEuiMarkdownUiPlugins();
  const parsingPlugins = getDefaultEuiMarkdownParsingPlugins();
  const processingPlugins = getDefaultEuiMarkdownProcessingPlugins() as TemporaryProcessingPluginsType;
  const lensMarkdownPlugin = lensMarkdownPlugin.init({
    lensComponent: LensComponent,
    soClient: savedObjects
  })
  uiPlugins.push(lensMarkdownPlugin.getPlugin(savedObjects));

  parsingPlugins.push(lensMarkdownPlugin.parser);

  // This line of code is TS-compatible and it will break if [1][1] change in the future.
  processingPlugins[1][1].components.lens = lensMarkdownPlugin.renderer;
  

  return {
    uiPlugins,
    parsingPlugins,
    processingPlugins,
  };
};
```
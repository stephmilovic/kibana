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
  const { parser, plugin, renderer } = lensMarkdownPlugin.init({
    lensComponent: LensComponent,
    soClient: savedObjects
  })
  parsingPlugins.push(parser);
  uiPlugins.push(plugin);

  // This line of code is TS-compatible and it will break if [1][1] change in the future.
  processingPlugins[1][1].components.lens = renderer;
  

  return {
    uiPlugins,
    parsingPlugins,
    processingPlugins,
  };
};
```
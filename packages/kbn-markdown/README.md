# kbn-markdown

Kibana flavored markdown plugins to use with the EuiMarkdown component within Kibana.

Example use:

```react
import { lensMarkdownPlugin } from '@kbn-markdown';

export const MyMarkdown = () => {
  const uiPlugins = getDefaultEuiMarkdownUiPlugins();
  const parsingPlugins = getDefaultEuiMarkdownParsingPlugins();
  const processingPlugins = getDefaultEuiMarkdownProcessingPlugins() as TemporaryProcessingPluginsType;

  uiPlugins.push(lensMarkdownPlugin.uiPlugin);

  parsingPlugins.push(lensMarkdownPlugin.parsingPlugin);

  // This line of code is TS-compatible and it will break if [1][1] change in the future.
  processingPlugins[1][1].components.lens = lensMarkdownPlugin.processingPluginRenderer;
  

  return {
    uiPlugins,
    parsingPlugins,
    processingPlugins,
  };
};
```
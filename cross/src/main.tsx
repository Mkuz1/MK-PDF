import { Component, render, type ComponentChildren } from 'preact';
import './styles.css';
import { initPlatform } from './app/platform';
import { App } from './ui/App';
import { startUpdateChecks } from './ui/Update';
import { offerDrafts, showToast } from './app/store';

/** If the interface itself fails, say so and offer a restart (unsaved changes are kept and offered back) instead of
 *  leaving a blank window. */
class Recover extends Component<{ children: ComponentChildren }, { failed: string | null }> {
  state = { failed: null as string | null };
  componentDidCatch(e: unknown) { console.error(e); this.setState({ failed: e instanceof Error ? e.message : String(e) }); }
  render() {
    if (this.state.failed === null) return this.props.children;
    return (
      <div class="crash" role="alert">
        <h1>MK PDF ran into a problem</h1>
        <p>Restart the app to carry on. Changes you hadn't saved are kept and will be offered back.</p>
        <p class="muted">{this.state.failed}</p>
        <button class="glass-btn prominent" onClick={() => location.reload()}>Restart MK PDF</button>
      </div>
    );
  }
}

// A failure nothing else reported still reaches the user (rendering that was merely cancelled is not a failure).
const quiet = /RenderingCancelled|AbortError|ResizeObserver loop/;
window.addEventListener('unhandledrejection', (e) => {
  const message = e.reason instanceof Error ? `${e.reason.name}: ${e.reason.message}` : String(e.reason);
  if (!quiet.test(message)) showToast(`Something went wrong: ${message.slice(0, 140)}`);
});

void initPlatform().then((p) => {
  document.documentElement.dataset.platform = p.kind;
  render(<Recover><App /></Recover>, document.getElementById('app')!);
  startUpdateChecks();
  void offerDrafts();
});

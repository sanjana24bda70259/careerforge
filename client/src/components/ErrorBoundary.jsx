import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('CareerForge UI error:', error, info);
  }

  retry = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;
    return <main className="app-fallback"><section><span className="overline">CAREERFORGE</span><h1>Something went wrong</h1><p>We couldn’t load this page. Your saved progress has not been changed.</p><div><button className="button secondary" onClick={this.retry}>Try again</button><a className="button" href="/dashboard">Go to Dashboard</a></div></section></main>;
  }
}

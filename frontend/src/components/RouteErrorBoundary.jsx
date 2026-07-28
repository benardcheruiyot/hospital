import React from 'react';

export default class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('Route render failure:', error);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="status-card error-state" role="alert">
          <div className="status-icon" aria-hidden="true">
            !
          </div>
          <h2>Something went wrong</h2>
          <p>This screen could not be rendered. Reload the workspace and try again.</p>
          <button className="btn" type="button" onClick={this.handleReload}>
            Reload application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
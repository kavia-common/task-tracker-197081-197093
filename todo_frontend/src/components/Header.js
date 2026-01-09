import React from 'react';

// PUBLIC_INTERFACE
export default function Header() {
  /** App header with title and subtitle for the task tracker UI. */
  return (
    <header className="tt-header">
      <div className="tt-header__inner">
        <div>
          <h1 className="tt-title">Task Tracker</h1>
          <p className="tt-subtitle">Add, edit, complete, and clear tasks — changes persist.</p>
        </div>
      </div>
    </header>
  );
}

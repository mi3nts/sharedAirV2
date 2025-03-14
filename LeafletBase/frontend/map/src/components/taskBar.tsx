import React from "react";
import "./taskBarStyle.css"; // Import the CSS file

function TaskBar(): JSX.Element {
  return (
    <div>
      <nav className="navbar bg-body-tertiary">
        <div className="container-fluid">
          <a className="navbar-brand">Task Bar</a>
          <form className="d-flex" role="search">
            <button className="btn btn-outline-success" type="submit">
              Search
            </button>
          </form>
        </div>
      </nav>
    </div>
  );
}

export default TaskBar;

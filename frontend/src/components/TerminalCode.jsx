import './TerminalCode.css';

/**
 * A terminal-themed code display component using the user's custom maroon/cream design.
 */
function TerminalCode({ code, title = "accessiscan-bash" }) {
  if (!code) return null;

  return (
    <div className="terminal-container">
      {/* Toolbar */}
      <div className="terminal_toolbar">
        <div className="terminal-btns">
          <button className="terminal-btn exit" aria-label="Close"></button>
          <button className="terminal-btn" aria-label="Minimize"></button>
          <button className="terminal-btn color" aria-label="Maximize"></button>
        </div>
        <div className="terminal-user-title">{title}</div>
      </div>

      {/* Body */}
      <div className="terminal_body">
        <div className="terminal_promt">
          <span className="terminal_user">ec2-user</span>
          <span className="terminal_bling">@</span>
          <span className="terminal_location">aws-instance</span>
          <span className="terminal_bling">:~$</span>
        </div>
        <pre className="terminal-content">
          <code>{code}</code>
          <span className="terminal_cursor"></span>
        </pre>
      </div>
    </div>
  );
}

export default TerminalCode;

import type { AuthUser } from '../../lib/auth'
import defftIcon from '../../assets/defft-icon.png'

interface TopBarProps {
  authUser: AuthUser
  onSignOut: () => void
  search: string
  onSearchChange: (value: string) => void
}

export function TopBar({ authUser, onSignOut, search, onSearchChange }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="brand-lockup">
        <div className="brand-lockup__icon-shell" aria-hidden="true">
          <img className="brand-lockup__icon" src={defftIcon} alt="" />
        </div>
        <div>
          <p className="brand-lockup__eyebrow">Defft</p>
          <h1>Meeting Prep Tool</h1>
        </div>
      </div>

      <div className="topbar__controls">
        <label className="search-field">
          <span className="search-field__label">Search</span>
          <input
            type="search"
            placeholder="Account, contact, meeting type"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>

        <button className="ghost-button topbar-signout" onClick={onSignOut} type="button">
          <div className="user-chip user-chip--compact">
            <div className="user-chip__avatar">{authUser.initials}</div>
            <div className="user-chip__details">
              <strong>{authUser.name}</strong>
              <span>Sign out</span>
            </div>
          </div>
        </button>
      </div>
    </header>
  )
}

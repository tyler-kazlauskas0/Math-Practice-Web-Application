import PageContainer from '../components/layout/PageContainer'
import { useSettings } from '../hooks/useSettings'
import './SettingsPage.css'

function SettingsPage() {
  const { settings, updateSettings } = useSettings()

  return (
    <PageContainer title="Settings">
      <div className="settings-list">
        <label className="setting-toggle">
          <input
            type="checkbox"
            className="setting-toggle__input"
            checked={settings.animationsEnabled}
            onChange={(event) => updateSettings({ animationsEnabled: event.target.checked })}
            aria-labelledby="animations-label"
            aria-describedby="animations-description"
          />
          <span className="setting-toggle__text">
            <span id="animations-label" className="setting-toggle__label">
              Card flip animation
            </span>
            <span id="animations-description" className="setting-toggle__description">
              Turn this off if the moving card is distracting. Your device’s “reduce motion” setting
              also turns it off.
            </span>
          </span>
        </label>
      </div>
      <p className="settings-note">More settings are coming soon!</p>
    </PageContainer>
  )
}

export default SettingsPage

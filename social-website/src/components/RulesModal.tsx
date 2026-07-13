import '../styles/RulesModal.css'

interface RulesModalProps {
  onAccept: () => void
  onDecline: () => void
}

export default function RulesModal({ onAccept, onDecline }: RulesModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal-card">

        <div className="modal-header">
          <div className="modal-logo">AeroSocial</div>
          <div className="modal-title">Community Guidelines</div>
          <div className="modal-sub">
            Please read and accept our rules before joining.
          </div>
        </div>

        <div className="modal-body">

          <div className="rule-section">
            <div className="rule-section-title">👤 Respect & Conduct</div>
            <ul>
              <li>Treat all users with respect and kindness at all times.</li>
              <li>Harassment, bullying, hate speech, or discrimination of any kind — including based on race, gender, religion, nationality, sexual orientation, or disability — is strictly prohibited.</li>
              <li>Personal attacks, threats, or targeted abuse toward any user will result in immediate account suspension.</li>
            </ul>
          </div>

          <div className="rule-section">
            <div className="rule-section-title">🔞 Content Standards</div>
            <ul>
              <li>NSFW (Not Safe For Work) content of any kind is strictly forbidden. This includes nudity, sexually explicit material, graphic violence, or gore.</li>
              <li>Do not share content that promotes self-harm, suicide, eating disorders, or dangerous behavior.</li>
              <li>Shock content, disturbing imagery, or content intended to distress others is not allowed.</li>
            </ul>
          </div>

          <div className="rule-section">
            <div className="rule-section-title">🔒 Privacy & Safety</div>
            <ul>
              <li>Do not share personal information of others without their explicit consent (doxxing).</li>
              <li>Do not impersonate other users, public figures, or AeroSocial staff.</li>
              <li>You are responsible for keeping your account credentials secure.</li>
            </ul>
          </div>

          <div className="rule-section">
            <div className="rule-section-title">🚫 Prohibited Activity</div>
            <ul>
              <li>Spam, scam links, phishing attempts, or unsolicited advertising are not permitted.</li>
              <li>Do not share pirated content, illegal material, or links to harmful software.</li>
              <li>Creating multiple accounts to evade bans or suspensions is not allowed.</li>
              <li>Any activity that violates local or international law is strictly forbidden.</li>
            </ul>
          </div>

          <div className="rule-section">
            <div className="rule-section-title">⚠️ Age Requirement</div>
            <ul>
              <li>You must be at least 15 years of age to register and use AeroSocial.</li>
              <li>Do not attempt to register on behalf of someone who does not meet the age requirement.</li>
            </ul>
          </div>

          <div className="rule-section">
            <div className="rule-section-title">🛡️ Enforcement</div>
            <ul>
              <li>Violations of these guidelines may result in content removal, temporary suspension, or permanent banning depending on severity.</li>
              <li>AeroSocial reserves the right to remove any content or account at its discretion.</li>
              <li>If you see a violation, please report it so we can keep the community safe.</li>
            </ul>
          </div>

          <div className="modal-agreement">
            By clicking <strong>I Agree</strong>, you confirm that you have read, understood,
            and agree to follow these Community Guidelines and our Terms of Service.
          </div>

        </div>

        <div className="modal-footer">
          <button className="btn-decline" onClick={onDecline}>
            Decline
          </button>
          <button className="btn-agree" onClick={onAccept}>
            I Agree
          </button>
        </div>

      </div>
    </div>
  )
}
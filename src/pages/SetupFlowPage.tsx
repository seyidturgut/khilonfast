import { useMemo, useState } from 'react'
import {
  HiArrowRightOnRectangle,
  HiCheckBadge,
  HiCodeBracket,
  HiDocumentText,
  HiQuestionMarkCircle,
  HiShieldCheck,
  HiUserPlus,
  HiUsers,
  HiMagnifyingGlass
} from 'react-icons/hi2'
import { setupFlows } from '../data/setupFlows'
import './SearchConsoleSetup.css'

type SetupFlowPageProps = {
  path: string
}

const stepIcons = [
  HiArrowRightOnRectangle,
  HiUserPlus,
  HiShieldCheck,
  HiUsers,
  HiDocumentText,
  HiCodeBracket,
  HiMagnifyingGlass
]

export default function SetupFlowPage({ path }: SetupFlowPageProps) {
  const flow = useMemo(() => setupFlows.find((item) => item.path === path), [path])

  const [selectedPathId, setSelectedPathId] = useState<string>(flow?.paths[0]?.id ?? '')

  if (!flow) {
    return null
  }

  const selectedPath = flow.paths.find((item) => item.id === selectedPathId) ?? flow.paths[0]

  return (
    <div className="sc-setup-page">
      <div className="container sc-setup-container">
        <header className="sc-header">
          <h1 className="sc-title">{flow.title}</h1>
          <p className="sc-subtitle">{flow.subtitle}</p>

          <div className="sc-purpose-box">
            <div className="purpose-header">
              <HiMagnifyingGlass className="purpose-icon" />
              <h3>Amaç</h3>
            </div>
            <p>{flow.purpose}</p>
          </div>

          <div className="sc-top-video">
            <div className="video-glass-wrapper">
              <div className="video-container">
                <iframe
                  src={flow.videoUrl}
                  title={flow.title}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>
        </header>

        <section className="sc-decision-section">
          <div className="decision-node">
            <div className="decision-icon-box">
              <HiQuestionMarkCircle />
            </div>
            <h2>Karar Noktası</h2>
            <p className="decision-question">{flow.decisionQuestion}</p>

            <div className="decision-buttons">
              {flow.paths.map((item, index) => (
                <button
                  key={item.id}
                  className={`btn-decision ${index === 0 ? 'btn-yes' : 'btn-no'} ${selectedPath.id === item.id ? 'active' : ''}`}
                  onClick={() => setSelectedPathId(item.id)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="sc-path-viewport">
            <div className="path-content animate-fade-in">
              <div className={`path-header ${selectedPath.id.includes('no') ? 'no' : 'yes'}`}>{selectedPath.label}</div>
              <div className="steps-container">
                {selectedPath.steps.map((step, idx) => {
                  const Icon = stepIcons[idx % stepIcons.length]
                  const isLastStep = idx === selectedPath.steps.length - 1

                  return (
                    <div key={step.title + idx}>
                      <div className="sc-step-card">
                        <div className="step-icon-wrap">
                          <Icon />
                        </div>
                        <div className="step-text">
                          <h3>Adım {idx + 1}</h3>
                          <p>
                            <strong>{step.title}</strong>
                            <br />
                            {step.description}
                          </p>
                        </div>
                      </div>
                      {!isLastStep && <div className="step-connector"></div>}
                    </div>
                  )
                })}
                <div className="step-connector"></div>
                <div className="sc-completion-card">
                  <div className="completion-content">
                    <HiCheckBadge className="completion-icon" />
                    <div>
                      <h3>{selectedPath.completionTitle}</h3>
                      <p>{selectedPath.completionDescription}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

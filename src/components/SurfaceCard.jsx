import { motion } from 'framer-motion'

export function SurfaceCard({ title, eyebrow, children, actions, ...props }) {
  return (
    <motion.section
      {...props}
      className="surface-card"
      variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
    >
      <div className="surface-card__head">
        <div>
          {eyebrow ? <p className="kicker">{eyebrow}</p> : null}
          <h3>{title}</h3>
        </div>
        {actions ? <div className="surface-card__actions">{actions}</div> : null}
      </div>
      {children}
    </motion.section>
  )
}

import { motion } from 'framer-motion'

export function MetricGrid({ items }) {
  return (
    <section className="metric-grid">
      {items.map((item) => (
        <motion.article
          className="metric-card"
          key={item.label}
          variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
        >
          <p className="metric-card__label">{item.label}</p>
          <strong>{item.value}</strong>
          <span>{item.note}</span>
        </motion.article>
      ))}
    </section>
  )
}

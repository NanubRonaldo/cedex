export default function ProgressBar({ percent = 0, color = "#0077ff" }) {
  const safe = Math.max(0, Math.min(100, Number(percent || 0)));

  return (
    <div style={styles.outer}>
      <div
        style={{
          ...styles.inner,
          width: `${safe}%`,
          backgroundColor: color
        }}
      />
    </div>
  );
}

const styles = {
  outer: {
    backgroundColor: "#cbd5e1",
    borderRadius: "13px",
    padding: "3px"
  },
  inner: {
    height: "10px",
    borderRadius: "7px",
    transition: "width 180ms ease"
  }
};

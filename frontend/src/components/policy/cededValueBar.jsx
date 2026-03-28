export default function CededValueBar({ totalValue, cededValue }) {
  const percent = totalValue
    ? Math.min((cededValue / totalValue) * 100, 100)
    : 0;

  return (
    <div style={styles.container}>
      <div style={styles.label}>
        Ceded: {cededValue} / {totalValue} ({percent.toFixed(1)}%)
      </div>

      <div style={styles.outer}>
        <div style={{ ...styles.inner, width: `${percent}%` }} />
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    marginTop: "8px"
  },
  label: {
    fontSize: "11px",
    marginBottom: "4px",
    color: "#333"
  },
  outer: {
    backgroundColor: "lightgray",
    borderRadius: "13px",
    padding: "3px"
  },
  inner: {
    backgroundColor: "#0077ff",
    height: "10px",
    borderRadius: "7px",
    transition: "width 0.3s ease-in-out"
  }
};

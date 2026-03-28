export default function AuthLayout({ children }) {
  return (
    <div style={styles.container}>
      
      <div style={styles.glow}></div>

      <div style={styles.card}>
        {children}
      </div>

    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0b1220",
    position: "relative"
  },

  glow: {
    position: "absolute",
    width: "300px",
    height: "300px",
    background: "#0077ff",
    filter: "blur(120px)",
    opacity: 0.2,
    pointerEvents: "none"
  },

  card: {
    position: "relative",
    zIndex: 1,
    width: "360px",
    padding: "25px",
    borderRadius: "14px",
    background: "#111827",
    color: "#fff",
    boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
    display: "flex",
    flexDirection: "column",
    gap: "15px"
  }
};

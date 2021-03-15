import styles from "./Spinner.module.scss";

export default function Spinner() {
  return (
    <div className={styles.spinner}>
      <div>
        <span>⣷</span>
        <span>⣯</span>
        <span>⣟</span>
        <span>⡿</span>
        <span>⢿</span>
        <span>⣻</span>
        <span>⣽</span>
        <span>⣾</span>
      </div>
    </div>
  );
}

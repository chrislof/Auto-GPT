"use client";

import { useState, type FormEvent } from "react";
import styles from "./ContactForm.module.css";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className={styles.thanks} role="status">
        <p>
          Thanks — this form is a front-end CTA only. Email{" "}
          <a href="mailto:hello@mindpress.ca">hello@mindpress.ca</a> and we will
          follow up.
        </p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <label className={styles.field}>
        <span>Name</span>
        <input name="name" type="text" autoComplete="name" required />
      </label>
      <label className={styles.field}>
        <span>Work email</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label className={styles.field}>
        <span>Company</span>
        <input name="company" type="text" autoComplete="organization" />
      </label>
      <label className={styles.field}>
        <span>What work needs to get done?</span>
        <textarea name="message" rows={5} required />
      </label>
      <button type="submit" className={styles.submit}>
        Send inquiry
      </button>
      <p className={styles.hint}>
        No fake backend — use this to sketch the ask, then email us to start a
        diagnostic conversation.
      </p>
    </form>
  );
}

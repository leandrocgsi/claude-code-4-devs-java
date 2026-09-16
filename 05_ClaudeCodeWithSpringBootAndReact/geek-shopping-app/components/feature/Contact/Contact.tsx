'use client';

import { FormEvent, useState } from 'react';
import { FaEnvelope, FaMapMarkerAlt, FaPhoneAlt } from 'react-icons/fa';
import Input from '@/components/ui/atoms/Input';
import Button from '@/components/ui/atoms/Button';
import SectionTitle from '@/components/ui/atoms/SectionTitle';
import styles from './Contact.module.css';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <section className={styles.wrapper}>
      <nav className={styles.breadcrumb}>
        <span>Home</span>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className={styles.breadcrumbActive}>Contact</span>
      </nav>

      <SectionTitle as="h2" size="lg">
        Contact Us
      </SectionTitle>

      <div className={styles.layout}>
        <div className={styles.formCard}>
          {submitted ? (
            <p className={styles.confirmation}>
              This is a demo form — your message was not actually sent, but here it is: <strong>{subject || '(no subject)'}</strong>
            </p>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              <Input placeholder="Your Name" value={name} onChange={(event) => setName(event.target.value)} required />
              <Input
                type="email"
                placeholder="Your Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <Input placeholder="Subject" value={subject} onChange={(event) => setSubject(event.target.value)} required />
              <textarea
                className={styles.textarea}
                rows={8}
                placeholder="Message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                required
              />
              <Button type="submit" variant="primary">
                Send Message
              </Button>
            </form>
          )}
        </div>

        <div className={styles.infoColumn}>
          <div className={styles.mapCard}>
            <iframe
              className={styles.map}
              src="https://www.google.com/maps?q=Av.+Brasil,+123+-+Centro,+Uberl%C3%A2ndia+-+MG,+38400-100&output=embed"
              loading="lazy"
              title="Map"
            />
          </div>
          <div className={styles.infoCard}>
            <p className={styles.infoRow}>
              <FaMapMarkerAlt /> Av. Brasil, 123 - Centro, Uberlândia - MG, 38400-100
            </p>
            <p className={styles.infoRow}>
              <FaEnvelope /> contato@geekshopping.com.br
            </p>
            <p className={styles.infoRow}>
              <FaPhoneAlt /> +55 (34) 3212-3456
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

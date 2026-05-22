import { useState } from 'react';
import { setMerchantId } from '../utils/api';

export default function MerchantSetup({ onSet }) {
  const [id, setId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (id.trim()) {
      setMerchantId(id.trim());
      onSet(id.trim());
    }
  };

  return (
    <div className="merchant-setup">
      <div className="setup-card">
        <h2>Welcome to Exportify</h2>
        <p>Enter your Merchant ID to get started.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Merchant ID (e.g. 196jdfqy1aot)"
            value={id}
            onChange={(e) => setId(e.target.value)}
            autoFocus
          />
          <button type="submit" disabled={!id.trim()}>Connect</button>
        </form>
      </div>
    </div>
  );
}

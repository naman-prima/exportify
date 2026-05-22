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
    <div className="setup-page">
      <div className="setup-box">
        <div className="setup-logo">E</div>
        <h1>Exportify</h1>
        <p>Bulk export your store data to Excel or CSV</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter your Merchant ID"
            value={id}
            onChange={(e) => setId(e.target.value)}
            autoFocus
          />
          <button type="submit" disabled={!id.trim()}>Connect Store</button>
        </form>
      </div>
    </div>
  );
}

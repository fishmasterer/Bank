import React, { useEffect, useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../utils/currency';

const CurrencyDisplay = ({ amount, className = '' }) => {
  const { settings, convertAmount } = useSettings();
  const [secondaryAmount, setSecondaryAmount] = useState(null);

  useEffect(() => {
    if (settings.showSecondaryCurrency && settings.secondaryCurrency) {
      const converted = convertAmount(amount, settings.secondaryCurrency);
      setSecondaryAmount(converted);
    }
  }, [amount, settings, convertAmount]);

  const primaryFormatted = formatCurrency(amount, settings.primaryCurrency);

  return (
    <span className={className}>
      {primaryFormatted}
      {settings.showSecondaryCurrency && settings.secondaryCurrency && secondaryAmount !== null && (
        <span className="secondary-currency">
          {' '}({formatCurrency(secondaryAmount, settings.secondaryCurrency)})
        </span>
      )}
    </span>
  );
};

export default CurrencyDisplay;

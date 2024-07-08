'use client';
import React from 'react';
import { NumericFormat } from 'react-number-format';

interface Props {
  value: number;
}

const Currency = ({ value }: Props) => {
  return (
    <NumericFormat
      value={value}
      prefix={'$'}
      displayType={'text'}
      thousandSeparator={','}
      decimalSeparator={'.'}
      decimalScale={2}
      fixedDecimalScale
    />
  );
};

export default Currency;

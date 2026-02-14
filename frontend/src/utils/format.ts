export const formatPercent = (value?: number) => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return 'N/A';
  }
  return `${(value * 100).toFixed(1)}%`;
};

export const formatDateTime = (value?: string) => {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleString();
};

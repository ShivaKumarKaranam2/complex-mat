const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function MonthNavigator({
  month,
  year,
  onPrevious,
  onNext,
}: {
  month: number;
  year: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="month-navigator">
      <button type="button" className="btn btn-secondary" onClick={onPrevious} aria-label="Previous month">
        ‹
      </button>
      <h3>
        {MONTH_NAMES[month - 1]} {year}
      </h3>
      <button type="button" className="btn btn-secondary" onClick={onNext} aria-label="Next month">
        ›
      </button>
    </div>
  );
}

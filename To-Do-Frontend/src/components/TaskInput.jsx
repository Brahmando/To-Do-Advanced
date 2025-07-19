import React from 'react';

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const currentYear = new Date().getFullYear();
// const hours = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12 for AM/PM
// const minutes = Array.from({ length: 60 }, (_, i) => i);

const TaskInput = ({ input, setInput, date, setDate, handleAdd, isGroupTaskMode, setIsGroupTaskMode, groupName, setGroupName }) => {
  const initial = date ? new Date(date) : new Date();

  // Store date parts as strings to allow empty inputs
  const [year, setYear] = React.useState(String(initial.getFullYear()));
  const [month, setMonth] = React.useState(initial.getMonth());
  const [day, setDay] = React.useState(String(initial.getDate()));
  const [hour, setHour] = React.useState(String(initial.getHours() % 12 || 12));
  const [minute, setMinute] = React.useState(String(initial.getMinutes()));
  const [isPM, setIsPM] = React.useState(initial.getHours() >= 12);
  const [dateError, setDateError] = React.useState('');

  React.useEffect(() => {
    // Only update the final date string if all parts are valid
    if (year && day && hour && minute) {
      const numYear = Number(year);
      const numDay = Number(day);
      const numHour = Number(hour);
      const numMinute = Number(minute);

      let hoursIn24 = numHour;
      if (isPM && numHour < 12) hoursIn24 = numHour + 12;
      if (!isPM && numHour === 12) hoursIn24 = 0; // Midnight case

      const d = new Date(numYear, month, numDay, hoursIn24, numMinute);

      if (!isNaN(d.getTime())) {
        setDate(d.toISOString().slice(0, 16));
        setDateError(''); // Clear error on valid date
      }
    }
  }, [year, month, day, hour, minute, isPM, setDate]);

  const handleDateChange = (type, value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (type === 'year' && numericValue.length <= 4) setYear(numericValue);
    if (type === 'month') setMonth(Number(numericValue));
    if (type === 'day' && numericValue.length <= 2) setDay(numericValue);
    if (type === 'hour' && numericValue.length <= 2) setHour(numericValue);
    if (type === 'minute' && numericValue.length <= 2) setMinute(numericValue);
    if (type === 'ampm') setIsPM(value === 'PM');
  };

  const handleAddTask = () => {
    if (!year || !day || !hour || !minute) {
      setDateError('All date and time fields are required.');
      return;
    }
    setDateError('');
    handleAdd();
  };

  return (
    <div className="mb-8">
      {/* Group Task Toggle */}
      <div className="mb-4 p-4 bg-purple-50/50 rounded-xl border border-purple-200">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isGroupTaskMode}
            onChange={(e) => setIsGroupTaskMode(e.target.checked)}
            className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
          />
          <span className="text-purple-700 font-medium">Group Task Mode</span>
        </label>

        {isGroupTaskMode && (
          <div className="mt-3">
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              className="w-full px-3 py-2 rounded-lg border-2 border-purple-200 focus:border-purple-500 focus:outline-none bg-white/70 backdrop-blur-sm text-gray-800 placeholder-gray-500"
              required={isGroupTaskMode}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-2 md:gap-4 mb-6 items-center justify-center w-full flex-wrap">
        <input
          type="text"
          className="flex-1 bg-white/90 rounded-xl border border-blue-200 shadow px-3 py-2 md:px-5 md:py-3 text-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          placeholder="Add a new task..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <div className="flex flex-col md:flex-row items-center gap-2 flex-grow">
          <div className="flex  px-1 md:px-2 py-2 rounded-2xl backdrop-blur-md bg-white/40 border border-blue-100 items-center">
            <input
              type="text" // Changed from number to text
              value={day}
              onChange={e => handleDateChange('day', e.target.value)}
              placeholder="DD"
              className="w-16 appearance-none rounded-lg border-none bg-transparent px-2 py-1 focus:ring-2 focus:ring-indigo-200 outline-none text-xl text-center"
            />
            <select value={month} onChange={e => handleDateChange('month', e.target.value)} className="appearance-none rounded-lg border-none bg-transparent px-2 py-1 focus:ring-2 focus:ring-indigo-200 outline-none font-bold">
              {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <input
              type="text" // Changed from number to text
              value={year}
              placeholder="YYYY"
              onChange={e => handleDateChange('year', e.target.value)}
              className="w-20 rounded-lg border-none bg-transparent px-2 py-1 focus:ring-2 focus:ring-indigo-200 text-xl font-semibold text-indigo-700 text-center appearance-none outline-none"
            />
          </div>
          <div className="flex items-center gap-1 px-2 md:px-4 py-2 rounded-full backdrop-blur-md bg-gradient-to-br from-white/40 to-cyan-100/70 border border-cyan-200">
            <input
              type="text" // Changed from number to text
              value={hour}
              placeholder="HH"
              onChange={e => handleDateChange('hour', e.target.value)}
              className="w-14 rounded-lg border-none bg-transparent px-2 py-1 text-xl font-mono focus:ring-2 focus:ring-cyan-200 text-center outline-none"
            />

            <select value={isPM ? 'PM' : 'AM'} onChange={e => handleDateChange('ampm', e.target.value)} className="appearance-none rounded-lg border border-cyan-200 bg-transparent px-2 py-1 text-base outline-none font-bold">
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
            <span className="mx-2 flex items-center justify-center" style={{ width: '8px', height: '32px' }}>
              <span className="block w-0.5 h-6 bg-gradient-to-b from-cyan-400 to-indigo-400 rounded-full"></span>
            </span>
            <input
              type="text" // Changed from number to text
              value={minute}
              placeholder="MM"
              onChange={e => handleDateChange('minute', e.target.value)}
              className="w-14 rounded-lg border-none bg-transparent px-2 py-1 text-xl font-mono focus:ring-2 focus:ring-cyan-200 text-center outline-none"
            />

          </div>
        </div>
        <button
          onClick={handleAddTask} // Changed to custom handler
          className="min-w-[8rem] h-12 text-xl font-bold rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 text-white shadow-xl border-none focus:outline-none focus:ring-2 focus:ring-indigo-300 px-6 transition hover:scale-105 hover:shadow-2xl"
        >
          Add
        </button>
      </div>
      {dateError && <p className="text-red-500 text-center font-semibold mt-2">{dateError}</p>}
    </div>
  );
};

export default TaskInput;
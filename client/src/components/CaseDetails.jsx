function CaseDetails({ data }) {
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-[32rem] mt-6 text-white">
      <h2 className="text-2xl font-bold mb-4">Case Details</h2>
      <p><strong>Parties:</strong> {data.parties || 'N/A'}</p>
      <p><strong>Filing Date:</strong> {data.filingDate || 'N/A'}</p>
      <p><strong>Next Hearing Date:</strong> {data.nextHearingDate || 'N/A'}</p>

      <div className="mt-4">
        <h3 className="text-xl mb-2">Orders / Judgments</h3>
        {data.orders?.length > 0 ? (
          <ul className="list-disc pl-5">
            {data.orders.map((order, idx) => (
              <li key={idx}>
                <a href={order.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  {order.text}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p>No orders available</p>
        )}
      </div>
    </div>
  );
}

export default CaseDetails;

function CaseDetails({ data }) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl mt-8 border border-gray-200">
      <h2 className="text-3xl font-extrabold mb-6 text-gray-900 text-center">Case Details</h2>

      {/* Primary Case Information Section */}
      <div className="space-y-4 text-lg text-gray-700 mb-8 pb-8 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <p className="font-semibold text-gray-800">Parties:</p>
          <p className="text-right flex-1 ml-4">{data.parties || <span className="text-gray-500 italic">N/A</span>}</p>
        </div>
        <div className="flex justify-between items-start">
          <p className="font-semibold text-gray-800">Filing Date:</p>
          <p className="text-right flex-1 ml-4">{data.filingDate || <span className="text-gray-500 italic">N/A</span>}</p>
        </div>
        <div className="flex justify-between items-start">
          <p className="font-semibold text-gray-800">Next Hearing Date:</p>
          <p className="text-right flex-1 ml-4">{data.nextHearingDate || <span className="text-gray-500 italic">N/A</span>}</p>
        </div>
      </div>

      {/* Orders / Judgments Section */}
      <div className="mt-6">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">Orders / Judgments</h3>
        {data.orders?.length > 0 ? (
          <ul className="space-y-3">
            {data.orders.map((order, idx) => (
              <li key={idx} className="flex items-center text-gray-700">
                <svg className="w-5 h-5 mr-3 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.414L14.586 5A2 2 0 0115 5.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 10a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h4a1 1 0 100-2H7z" clipRule="evenodd"></path>
                </svg>
                <a 
                  href={order.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:text-blue-800 hover:underline font-medium break-words"
                >
                  {order.text}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 italic p-4 bg-gray-50 rounded-lg text-center">No orders or judgments available for this case.</p>
        )}
      </div>
    </div>
  );
}

export default CaseDetails;
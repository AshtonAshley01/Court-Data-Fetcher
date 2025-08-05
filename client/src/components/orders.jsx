import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

function OrdersPage() {
  const [searchParams] = useSearchParams();
  const link = searchParams.get('link');
  const [data, setData] = useState(null);

  useEffect(() => {
    if (link) {
      axios.get(`http://localhost:3001/api/case-orders?link=${encodeURIComponent(link)}`)
        .then(res => setData(res.data))
        .catch(err => console.error('Error fetching orders:', err));
    }
  }, [link]);

  if (!data) return <p className="text-center p-5">Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-center">Case Orders</h1>
      <div className="bg-gray-100 p-4 rounded mb-4">
        <p><strong>Filing Date:</strong> {data.filingDate || 'N/A'}</p>
        <p><strong>Next Hearing Date:</strong> {data.nextHearingDate || 'N/A'}</p>
      </div>

      <table className="w-full border border-gray-300">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2 border">S.No.</th>
            <th className="p-2 border">Case No/Order Link</th>
            <th className="p-2 border">Date of Order</th>
            <th className="p-2 border">Corrigendum</th>
            <th className="p-2 border">Hindi Order</th>
            <th className="p-2 border">PDF</th>
          </tr>
        </thead>
        <tbody>
          {data.ordersData.map((order, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="p-2 border">{order.serialNo}</td>
              <td className="p-2 border">{order.caseNoOrOrderLink}</td>
              <td className="p-2 border">{order.dateOfOrder}</td>
              <td className="p-2 border">{order.corrigendum}</td>
              <td className="p-2 border">{order.hindiOrder}</td>
              <td className="p-2 border">
                {order.pdfLink ? (
                  <a href={order.pdfLink} target="_blank" className="text-blue-600 underline">Download PDF</a>
                ) : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default OrdersPage;

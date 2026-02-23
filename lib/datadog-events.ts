import { datadogRum } from '@datadog/browser-rum';

export function trackSearchWithTrace(query: string, resultsCount: number) {
  const internalContext = datadogRum.getInternalContext();
  datadogRum.addAction('search_performed', {
    query,
    results_count: resultsCount,
    rum_session_id: internalContext?.session_id,
    rum_view_id: internalContext?.view?.id,
    rum_trace_id: internalContext?.trace_id,
  });
}

export function trackOrderPlaced(orderId: string, amount: number) {
  datadogRum.addAction('order_placed', {
    order_id: orderId,
    amount,
  });
}

// 其他自訂事件...

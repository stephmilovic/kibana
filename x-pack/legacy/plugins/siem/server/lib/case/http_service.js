/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */


import React, { useState, useEffect } from 'react';
import { useKibanaCore } from '../../../public/lib/compose/kibana_core';

export const useApiCall = (request, headers) => {
  console.log('USE API CALL!!!!');
  const core = useKibanaCore();
  const [page, setPage] = useState(1);
  const [apiResponse, setApiResponse] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    core.http.fetch(
      `https://api.github.com/search/commits?q=repo:facebook/react+css&page=${page}`,
      {
        method: request.method,
        ...request.options,
        headers
      }
    )
      .then(res => res.json())
      .then(response => {
        setApiResponse(response.items);
        setIsLoading(false);
      })
      .catch(error => console.log(error));
  }, [page]);

  return apiResponse;
}

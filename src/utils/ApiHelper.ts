import axios from 'axios';

const URL = {
  apiUrl: import.meta.env.VITE_APP_API_TARGET
};

export const Securitykey = import.meta.env.VITE_APP_ENCRYPT_KEY || '';

// API HEADER
export const apiHeader = (isFormData: any) => {
  const authToken = import.meta.env.VITE_APP_API_TOKEN;
  if (!isFormData) {
    return {
      headers: {
        'x-authorization': authToken,
        'Content-Type': 'application/json'
      }
    };
  }

  if (isFormData) {
    return {
      headers: {
        'x-authorization': authToken,
        'Content-Type': 'multipart/form-data'
      }
    };
  }
};

// API CALL for POST method
export const postData = async (api: any, data: any, headers: any) => {
  try {
    const url = `${URL.apiUrl}${api}`;

    const response = await axios.post(url, data, headers);

    if (['401', '403'].includes(String(response?.status))) {
      sessionStorage.clear();
      location.reload();
    }
    return response;
  } catch (error: any) {
    console.log('error ==============++==+=======+==+', error.message);
    console.log('error ==============++==+=======+==+', error);
    if (['401', '403'].includes(String(error?.response?.status))) {
      sessionStorage.clear();
      location.reload();
    }
    return error?.response;
  }
};

// API CALL for GET method
export const getData = async (api: any, params: any, headers: any) => {
  try {
    const url = `${URL.apiUrl}${api}`;

    const response = await axios.get(url, {
      params: params,
      headers: headers['headers']
    });

    if (['401', '403'].includes(String(response?.status))) {
      sessionStorage.clear();
      location.reload();
    }
    return response;
  } catch (error: any) {
    console.log('Error:', error.message);
    if (['401', '403'].includes(String(error?.response?.status))) {
      sessionStorage.clear();
      location.reload();
    }
    return error?.response;
  }
};

// API CALL for PATCH method
export const patchData = async (api: any, data: any, headers: any) => {
  try {
    const url = `${URL.apiUrl}${api}`;

    const response = await axios.patch(url, data, headers);

    if (['401', '403'].includes(String(response?.status))) {
      sessionStorage.clear();
      location.reload();
    }

    return response;
  } catch (error: any) {
    console.log('Error:', error.message);
    console.log('Error:::::::::::::::::::::::::::::::::', error);
    if (['401', '403'].includes(String(error?.response?.status))) {
      sessionStorage.clear();
      location.reload();
    }
    return error?.response;
  }
};

// API CALL for PUT method
export const putData = async (api: any, data: any, headers: any) => {
  try {
    const url = `${URL.apiUrl}${api}`;

    const response = await axios.put(url, data, headers);

    if (['401', '403'].includes(String(response?.status))) {
      sessionStorage.clear();
      location.reload();
    }
    return response;
  } catch (error: any) {
    console.log('Error:', error.message);
    if (['401', '403'].includes(String(error?.response?.status))) {
      sessionStorage.clear();
      location.reload();
    }
    return error?.response;
  }
};

// API CALL for DELETE method
export const deleteData = async (api: any, data: any, headers: any) => {
  try {
    const url = `${URL.apiUrl}${api}`;

    const response = await axios.delete(url, {
      data,
      ...headers
    });

    if (['401', '403'].includes(String(response?.status))) {
      sessionStorage.clear();
      location.reload();
    }
    return response;
  } catch (error: any) {
    console.log('Error:', error.message);

    if (['401', '403'].includes(String(error?.response?.status))) {
      sessionStorage.clear();
      location.reload();
    }

    return error?.response;
  }
};

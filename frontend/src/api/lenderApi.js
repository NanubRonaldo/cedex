import API from "./api";

export const getBanks = async () => {
  const response = await API.get("/lenders/banks");
  return response.data;
};

export const getMicrolenders = async () => {
  const response = await API.get("/lenders/microlenders");
  return response.data;
};

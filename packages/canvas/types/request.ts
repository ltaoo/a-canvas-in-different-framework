export interface HTTPResponse {
  errno: number;
  errmsg: string;
  data: any;
}
interface PaginationResponseData {
  count: number;
  currentPage: string;
  data: Array<unknown>;
  pageSize: string;
  totalPages: number;
}
export interface PaginationResponse extends HTTPResponse {
  data: PaginationResponseData;
}

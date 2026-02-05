export interface IOption {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

interface IReturn {
  page: number;
  skip: number;
  limit: number;
  sortBy: string;
  sortOrder: string;
}
const pagination = (options: IOption): IReturn => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;
  const sortBy = options.sortBy || 'createdAt';
  const sortOrder = options.sortOrder || 'desc';

  return { page, skip, limit, sortBy, sortOrder };
};

export default pagination;

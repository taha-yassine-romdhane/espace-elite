import EmployeeLayout from '../EmployeeLayout';

const StockPage = () => {
    return (
        <div>
            <h1 className="text-2xl font-bold">Gestion du Stock</h1>
            <p>Cette page est en cours de construction.</p>
        </div>
    );
};

StockPage.getLayout = (page: React.ReactNode) => (
    <EmployeeLayout>{page}</EmployeeLayout>
);

export default StockPage;

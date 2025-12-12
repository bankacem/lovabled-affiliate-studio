import { Layout } from "@/components/layout/Layout";
import { ImportDesigns } from "@/components/admin/ImportDesigns";

const Admin = () => {
  return (
    <Layout>
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <ImportDesigns />
        </div>
      </section>
    </Layout>
  );
};

export default Admin;

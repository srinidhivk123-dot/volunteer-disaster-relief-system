from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.disaster import Disaster
from app.schemas.disaster import DisasterCreate
from app.schemas.disaster import DisasterUpdate
from app.services.disaster_service import create_disaster
from app.services.disaster_service import get_all_disasters
from app.services.disaster_service import get_active_disasters
from app.services.disaster_service import get_disaster_by_id
from app.services.disaster_service import update_disaster
from app.services.disaster_service import delete_disaster


def get_test_db():
    engine=create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread":False}
    )

    TestingSessionLocal=sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine
    )

    Base.metadata.create_all(bind=engine)

    return TestingSessionLocal()


class TestDisasterService:

    def test_create_disaster(self):
        db=get_test_db()

        disaster_data=DisasterCreate(
            name="Test Flood",
            disaster_type="Flood",
            description="Test disaster",
            location="Trichy",
            status="active"
        )

        result=create_disaster(
            db,
            disaster_data
        )

        assert result.name=="Test Flood"
        assert result.disaster_type=="Flood"
        assert result.description=="Test disaster"
        assert result.location=="Trichy"
        assert result.status=="active"

        db.close()

    def test_create_disaster_invalid_status(self):
        db=get_test_db()

        disaster_data=DisasterCreate(
            name="Test Disaster",
            disaster_type="Flood",
            description="Test disaster",
            location="Trichy",
            status="invalid"
        )

        try:
            create_disaster(
                db,
                disaster_data
            )
            assert False
        except ValueError as error:
            assert str(error)=="Invalid disaster status"

        db.close()

    def test_get_all_disasters(self):
        db=get_test_db()

        disaster1=Disaster(
            name="Flood",
            disaster_type="Flood",
            description="Flood disaster",
            location="Trichy",
            status="active"
        )

        disaster2=Disaster(
            name="Cyclone",
            disaster_type="Cyclone",
            description="Cyclone disaster",
            location="Chennai",
            status="closed"
        )

        db.add_all([disaster1,disaster2])
        db.commit()

        result=get_all_disasters(db)

        assert len(result)==2
        assert result[0].name=="Cyclone"
        assert result[1].name=="Flood"

        db.close()

    def test_get_active_disasters(self):
        db=get_test_db()

        disaster1=Disaster(
            name="Active Flood",
            disaster_type="Flood",
            description="Active flood",
            location="Trichy",
            status="active"
        )

        disaster2=Disaster(
            name="Closed Cyclone",
            disaster_type="Cyclone",
            description="Closed cyclone",
            location="Chennai",
            status="closed"
        )

        disaster3=Disaster(
            name="Inactive Landslide",
            disaster_type="Landslide",
            description="Inactive landslide",
            location="Salem",
            status="inactive"
        )

        db.add_all([
            disaster1,
            disaster2,
            disaster3
        ])
        db.commit()

        result=get_active_disasters(db)

        assert len(result)==1
        assert result[0].name=="Active Flood"
        assert result[0].status=="active"

        db.close()

    def test_get_disaster_by_id(self):
        db=get_test_db()

        disaster=Disaster(
            name="Test Earthquake",
            disaster_type="Earthquake",
            description="Earthquake disaster",
            location="Madurai",
            status="active"
        )

        db.add(disaster)
        db.commit()
        db.refresh(disaster)

        result=get_disaster_by_id(
            db,
            disaster.id
        )

        assert result is not None
        assert result.id==disaster.id
        assert result.name=="Test Earthquake"

        db.close()

    def test_get_disaster_by_id_not_found(self):
        db=get_test_db()

        result=get_disaster_by_id(
            db,
            999
        )

        assert result is None

        db.close()

    def test_update_disaster(self):
        db=get_test_db()

        disaster=Disaster(
            name="Old Disaster",
            disaster_type="Flood",
            description="Old description",
            location="Trichy",
            status="active"
        )

        db.add(disaster)
        db.commit()
        db.refresh(disaster)

        disaster_data=DisasterUpdate(
            name="Updated Disaster",
            location="Chennai",
            status="closed"
        )

        result=update_disaster(
            db,
            disaster.id,
            disaster_data
        )

        assert result is not None
        assert result.name=="Updated Disaster"
        assert result.location=="Chennai"
        assert result.status=="closed"

        db.close()

    def test_update_disaster_partial(self):
        db=get_test_db()

        disaster=Disaster(
            name="Original Disaster",
            disaster_type="Flood",
            description="Original description",
            location="Trichy",
            status="active"
        )

        db.add(disaster)
        db.commit()
        db.refresh(disaster)

        disaster_data=DisasterUpdate(
            status="inactive"
        )

        result=update_disaster(
            db,
            disaster.id,
            disaster_data
        )

        assert result is not None
        assert result.name=="Original Disaster"
        assert result.description=="Original description"
        assert result.status=="inactive"

        db.close()

    def test_update_disaster_invalid_status(self):
        db=get_test_db()

        disaster=Disaster(
            name="Test Disaster",
            disaster_type="Flood",
            description="Test description",
            location="Trichy",
            status="active"
        )

        db.add(disaster)
        db.commit()
        db.refresh(disaster)

        disaster_data=DisasterUpdate(
            status="invalid"
        )

        try:
            update_disaster(
                db,
                disaster.id,
                disaster_data
            )
            assert False
        except ValueError as error:
            assert str(error)=="Invalid disaster status"

        db.close()

    def test_update_disaster_not_found(self):
        db=get_test_db()

        disaster_data=DisasterUpdate(
            status="closed"
        )

        result=update_disaster(
            db,
            999,
            disaster_data
        )

        assert result is None

        db.close()

    def test_delete_disaster(self):
        db=get_test_db()

        disaster=Disaster(
            name="Disaster To Delete",
            disaster_type="Flood",
            description="Test description",
            location="Trichy",
            status="closed"
        )

        db.add(disaster)
        db.commit()
        db.refresh(disaster)

        result=delete_disaster(
            db,
            disaster.id
        )

        assert result is not None
        assert result.id==disaster.id

        deleted=get_disaster_by_id(
            db,
            disaster.id
        )

        assert deleted is None

        db.close()

    def test_delete_disaster_not_found(self):
        db=get_test_db()

        result=delete_disaster(
            db,
            999
        )

        assert result is None

        db.close()
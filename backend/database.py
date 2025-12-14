import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()


class KestraDatabase:
    """
    Database client for querying Kestra executions from Postgres.
    """

    def __init__(
        self,
        host: str = "localhost",
        port: int = 5433,
        database: str = "kestra",
        user: str = "kestra",
        password: str = "k3str4"
    ):
        """Initialize database connection parameters."""
        self.host = host
        self.port = port
        self.database = database
        self.user = user
        self.password = password

    def get_connection(self):
        """Create and return a database connection."""
        return psycopg2.connect(
            host=self.host,
            port=self.port,
            database=self.database,
            user=self.user,
            password=self.password
        )

    def get_executions(
        self,
        namespace: str = "agrilink",
        limit: int = 50,
        flow_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetch executions from Kestra database.

        Args:
            namespace: Namespace to filter executions (default: "agrilink")
            limit: Maximum number of executions to return
            flow_id: Optional flow ID to filter by

        Returns:
            List of execution dictionaries
        """
        conn = self.get_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                query = """
                    SELECT
                        id,
                        namespace,
                        flow_id,
                        state_current,
                        start_date,
                        end_date,
                        state_duration,
                        value->>'inputs' as inputs,
                        value->'outputs' as outputs,
                        value->'state' as state
                    FROM executions
                    WHERE deleted = false
                        AND namespace = %s
                """

                params = [namespace]

                if flow_id:
                    query += " AND flow_id = %s"
                    params.append(flow_id)

                query += " ORDER BY start_date DESC LIMIT %s"
                params.append(limit)

                cursor.execute(query, params)
                results = cursor.fetchall()

                executions = []
                for row in results:
                    execution = dict(row)

                    if execution.get('start_date'):
                        execution['start_date'] = execution['start_date'].isoformat()
                    if execution.get('end_date'):
                        execution['end_date'] = execution['end_date'].isoformat()

                    executions.append(execution)

                return executions

        finally:
            conn.close()

    def get_execution_by_id(self, execution_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch a single execution by ID.

        Args:
            execution_id: Execution ID to fetch

        Returns:
            Execution dictionary or None if not found
        """
        conn = self.get_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(
                    """
                    SELECT
                        id,
                        namespace,
                        flow_id,
                        state_current,
                        start_date,
                        end_date,
                        state_duration,
                        value->>'inputs' as inputs,
                        value->'outputs' as outputs,
                        value->'state' as state,
                        value
                    FROM executions
                    WHERE deleted = false AND id = %s
                    """,
                    (execution_id,)
                )

                row = cursor.fetchone()
                if not row:
                    return None

                execution = dict(row)

                if execution.get('start_date'):
                    execution['start_date'] = execution['start_date'].isoformat()
                if execution.get('end_date'):
                    execution['end_date'] = execution['end_date'].isoformat()

                return execution

        finally:
            conn.close()


db = KestraDatabase()

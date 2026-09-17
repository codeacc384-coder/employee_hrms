import {
  AlertCircle,
  Award,
  BarChart3,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  Target,
  TrendingUp,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import "./Performance.css";

import { supabase } from "../lib/supabase";

export default function Performance() {
  const [employee, setEmployee] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [selectedGoal, setSelectedGoal] = useState(null);
  const [showGoalModal, setShowGoalModal] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showRecordModal, setShowRecordModal] = useState(false);

  /* =========================================================
     STATUS CLASS
  ========================================================= */

  const getStatusClass = (status) => {
    const value = String(status || "")
      .trim()
      .toLowerCase();

    if (
      value.includes("completed") ||
      value.includes("approved") ||
      value.includes("achieved") ||
      value === "complete"
    ) {
      return "status-success";
    }

    if (
      value.includes("pending") ||
      value.includes("progress") ||
      value.includes("review") ||
      value.includes("ongoing") ||
      value.includes("not started")
    ) {
      return "status-warning";
    }

    if (
      value.includes("rejected") ||
      value.includes("failed")
    ) {
      return "status-danger";
    }

    return "status-neutral";
  };

  /* =========================================================
     PROGRESS
  ========================================================= */

  const getProgress = (goal) => {
    const progress = Number(goal?.progress);

    if (Number.isNaN(progress)) {
      return 0;
    }

    return Math.min(
      100,
      Math.max(0, progress)
    );
  };

  /* =========================================================
     LOAD PERFORMANCE DATA
  ========================================================= */

  const loadPerformanceData = useCallback(
    async (isRefresh = false) => {
      try {
        setError("");

        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        /* -----------------------------------------------------
           1. GET LOGGED-IN USER
        ----------------------------------------------------- */

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          throw new Error(
            "User is not logged in."
          );
        }

        console.log(
          "Logged-in Supabase user:",
          user.id
        );

        /* -----------------------------------------------------
           2. GET PROFILE
        ----------------------------------------------------- */

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("employee_id, role")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        if (!profile?.employee_id) {
          throw new Error(
            "Employee profile was not found."
          );
        }

        console.log(
          "Profile employee ID:",
          profile.employee_id
        );

        /* -----------------------------------------------------
           3. GET EMPLOYEE
        ----------------------------------------------------- */

        const {
          data: employeeData,
          error: employeeError,
        } = await supabase
          .from("employees")
          .select("id")
          .eq("id", profile.employee_id)
          .maybeSingle();

        if (employeeError) {
          throw employeeError;
        }

        if (!employeeData) {
          throw new Error(
            "Employee record was not found."
          );
        }

        console.log(
          "Employee ID used for performance:",
          employeeData.id
        );

        setEmployee(employeeData);

        /* -----------------------------------------------------
           4. GET PERFORMANCE DATA
           
           ACTUAL TABLE:
           performance
        ----------------------------------------------------- */

        const {
          data: performanceRows,
          error: performanceError,
        } = await supabase
          .from("performance")
          .select(`
            id,
            employee_id,
            reviewer_id,
            cycle_name,
            goal_title,
            goal_description,
            goal_category,
            target,
            progress,
            goal_status,
            self_rating,
            reviewer_rating,
            final_rating,
            strengths,
            improvement_areas,
            feedback,
            review_status,
            due_date,
            created_at,
            updated_at,
            record_type
          `)
          .eq(
            "employee_id",
            employeeData.id
          )
          .order("created_at", {
            ascending: false,
          });

        if (performanceError) {
          throw performanceError;
        }

        console.log(
          "ALL PERFORMANCE ROWS:",
          performanceRows
        );

        /* -----------------------------------------------------
           DEBUG: GOAL ROWS
        ----------------------------------------------------- */

        const goalRows =
          (performanceRows || []).filter(
            (item) =>
              String(
                item.record_type || ""
              )
                .trim()
                .toLowerCase() === "goal"
          );

        console.log(
          "GOAL ROWS:",
          goalRows
        );

        console.log(
          "NUMBER OF GOALS:",
          goalRows.length
        );

        setPerformanceData(
          performanceRows || []
        );
      } catch (err) {
        console.error(
          "Performance loading error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load performance data."
        );

        setPerformanceData([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  /* =========================================================
     LOAD ON PAGE OPEN
  ========================================================= */

  useEffect(() => {
    loadPerformanceData();
  }, [loadPerformanceData]);

  /* =========================================================
     SEPARATE GOALS
     
     ACTUAL DATABASE VALUE:
     record_type = "Goal"
  ========================================================= */

  const goals = useMemo(() => {
    return performanceData.filter((item) => {
      const recordType = String(
        item.record_type || ""
      )
        .trim()
        .toLowerCase();

      return (
        recordType === "goal" &&
        Boolean(item.goal_title)
      );
    });
  }, [performanceData]);

  /* =========================================================
     SEPARATE REVIEWS
     
     ACTUAL DATABASE VALUE:
     record_type = "Review"
  ========================================================= */

  const performanceRecords = useMemo(() => {
    return performanceData.filter((item) => {
      const recordType = String(
        item.record_type || ""
      )
        .trim()
        .toLowerCase();

      return (
        recordType === "review" ||
        recordType ===
          "performance review"
      );
    });
  }, [performanceData]);

  /* =========================================================
     STATISTICS
  ========================================================= */

  const statistics = useMemo(() => {
    const totalGoals = goals.length;

    const completedGoals =
      goals.filter((goal) => {
        const status = String(
          goal.goal_status || ""
        )
          .trim()
          .toLowerCase();

        return (
          status.includes("completed") ||
          status.includes("complete") ||
          status.includes("achieved")
        );
      }).length;

    const averageProgress =
      totalGoals > 0
        ? Math.round(
            goals.reduce(
              (sum, goal) =>
                sum +
                getProgress(goal),
              0
            ) / totalGoals
          )
        : 0;

    const totalReviews =
      performanceRecords.length;

    return {
      totalGoals,
      completedGoals,
      averageProgress,
      totalReviews,
    };
  }, [
    goals,
    performanceRecords,
  ]);

  /* =========================================================
     GOAL MODAL
  ========================================================= */

  const openGoal = (goal) => {
    setSelectedGoal(goal);
    setShowGoalModal(true);
  };

  const closeGoal = () => {
    setSelectedGoal(null);
    setShowGoalModal(false);
  };

  /* =========================================================
     REVIEW MODAL
  ========================================================= */

  const openRecord = (record) => {
    setSelectedRecord(record);
    setShowRecordModal(true);
  };

  const closeRecord = () => {
    setSelectedRecord(null);
    setShowRecordModal(false);
  };

  /* =========================================================
     LOADING SCREEN
  ========================================================= */

  if (loading) {
    return (
      <div className="performance-page">
        <div className="performance-loading">
          <Loader2
            className="loading-spinner"
            size={32}
          />

          <p>
            Loading performance...
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="performance-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="tl-page-head">
        <div>
          <div className="tl-page-kicker">
            Employee Portal
          </div>

          <h1>
            Performance
          </h1>

          <p>
            Track your goals, progress,
            achievements and performance
            reviews.
          </p>
        </div>

        <button
          type="button"
          className="tl-secondary"
          onClick={() =>
            loadPerformanceData(true)
          }
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2
              size={17}
              className="loading-spinner"
            />
          ) : (
            <RefreshCw size={17} />
          )}

          Refresh
        </button>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="performance-error">
          <AlertCircle size={20} />

          <span>
            {error}
          </span>
        </div>
      )}

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <div className="performance-stats-grid">

        {/* TOTAL GOALS */}

        <div className="tl-card performance-stat-card">
          <div className="performance-stat-icon">
            <Target size={22} />
          </div>

          <div>
            <span className="performance-stat-label">
              Total Goals
            </span>

            <strong className="performance-stat-value">
              {statistics.totalGoals}
            </strong>
          </div>
        </div>

        {/* COMPLETED GOALS */}

        <div className="tl-card performance-stat-card">
          <div className="performance-stat-icon">
            <CheckCircle2 size={22} />
          </div>

          <div>
            <span className="performance-stat-label">
              Completed Goals
            </span>

            <strong className="performance-stat-value">
              {statistics.completedGoals}
            </strong>
          </div>
        </div>

        {/* AVERAGE PROGRESS */}

        <div className="tl-card performance-stat-card">
          <div className="performance-stat-icon">
            <TrendingUp size={22} />
          </div>

          <div>
            <span className="performance-stat-label">
              Average Progress
            </span>

            <strong className="performance-stat-value">
              {statistics.averageProgress}%
            </strong>
          </div>
        </div>

        {/* REVIEWS */}

        <div className="tl-card performance-stat-card">
          <div className="performance-stat-icon">
            <Award size={22} />
          </div>

          <div>
            <span className="performance-stat-label">
              Performance Reviews
            </span>

            <strong className="performance-stat-value">
              {statistics.totalReviews}
            </strong>
          </div>
        </div>

      </div>

      {/* =====================================================
          GOALS
      ===================================================== */}

      <section className="tl-card performance-section">

        <div className="performance-section-header">
          <div>
            <h2>
              My Goals
            </h2>

            <p>
              Review the goals assigned to you
              and track your progress.
            </p>
          </div>
        </div>

        {goals.length === 0 ? (
          <div className="performance-empty-state">

            <Target size={36} />

            <h3>
              No goals available
            </h3>

            <p>
              Goals assigned by your Team Lead
              will appear here.
            </p>

          </div>
        ) : (
          <div className="performance-goals-grid">

            {goals.map((goal) => {
              const progress =
                getProgress(goal);

              return (
                <div
                  className="performance-goal-card"
                  key={goal.id}
                >

                  {/* TOP */}

                  <div className="performance-goal-top">

                    <div className="performance-goal-icon">
                      <Target size={20} />
                    </div>

                    <span
                      className={`performance-status ${getStatusClass(
                        goal.goal_status
                      )}`}
                    >
                      {goal.goal_status ||
                        "Not Started"}
                    </span>

                  </div>

                  {/* TITLE */}

                  <h3>
                    {goal.goal_title ||
                      "Performance Goal"}
                  </h3>

                  {/* CATEGORY */}

                  {goal.goal_category && (
                    <div className="performance-goal-category">
                      {goal.goal_category}
                    </div>
                  )}

                  {/* DESCRIPTION */}

                  {goal.goal_description && (
                    <p className="performance-goal-description">
                      {goal.goal_description}
                    </p>
                  )}

                  {/* TARGET */}

                  {goal.target && (
                    <div className="performance-goal-target">

                      <span>
                        Target
                      </span>

                      <strong>
                        {goal.target}
                      </strong>

                    </div>
                  )}

                  {/* PROGRESS */}

                  <div className="performance-progress-header">

                    <span>
                      Progress
                    </span>

                    <strong>
                      {Math.round(progress)}%
                    </strong>

                  </div>

                  <div className="performance-progress-bar">

                    <div
                      className="performance-progress-fill"
                      style={{
                        width: `${progress}%`,
                      }}
                    />

                  </div>

                  {/* DUE DATE */}

                  {goal.due_date && (
                    <div className="performance-goal-due-date">

                      <Clock3 size={14} />

                      <span>
                        Due:{" "}
                        {new Date(
                          goal.due_date
                        ).toLocaleDateString()}
                      </span>

                    </div>
                  )}

                  {/* FOOTER */}

                  <div className="performance-goal-footer">

                    <button
                      type="button"
                      className="tl-secondary"
                      onClick={() =>
                        openGoal(goal)
                      }
                    >
                      View Details
                    </button>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </section>

      {/* =====================================================
          PERFORMANCE REVIEWS
      ===================================================== */}

      <section className="tl-card performance-section">

        <div className="performance-section-header">

          <div>

            <h2>
              Performance Reviews
            </h2>

            <p>
              View your performance evaluation
              and review history.
            </p>

          </div>

        </div>

        {performanceRecords.length === 0 ? (
          <div className="performance-empty-state">

            <BarChart3 size={36} />

            <h3>
              No performance reviews
            </h3>

            <p>
              Your performance reviews will
              appear here when available.
            </p>

          </div>
        ) : (
          <div className="performance-records-list">

            {performanceRecords.map(
              (record) => (
                <div
                  className="performance-record-card"
                  key={record.id}
                >

                  <div className="performance-record-icon">
                    <Award size={21} />
                  </div>

                  <div className="performance-record-main">

                    <div className="performance-record-title-row">

                      <h3>
                        {record.cycle_name ||
                          "Performance Review"}
                      </h3>

                      <span
                        className={`performance-status ${getStatusClass(
                          record.review_status
                        )}`}
                      >
                        {record.review_status ||
                          "Pending"}
                      </span>

                    </div>

                    <div className="performance-record-meta">

                      {record.created_at && (
                        <span>
                          <Clock3 size={15} />

                          {new Date(
                            record.created_at
                          ).toLocaleDateString()}
                        </span>
                      )}

                      {record.final_rating !==
                        null &&
                        record.final_rating !==
                          undefined && (
                          <span>
                            <Award size={15} />

                            Rating:{" "}
                            {
                              record.final_rating
                            }
                          </span>
                        )}

                    </div>

                    {record.feedback && (
                      <p>
                        {record.feedback}
                      </p>
                    )}

                  </div>

                  <button
                    type="button"
                    className="tl-secondary"
                    onClick={() =>
                      openRecord(record)
                    }
                  >
                    View
                  </button>

                </div>
              )
            )}

          </div>
        )}

      </section>

      {/* =====================================================
          GOAL DETAILS MODAL
      ===================================================== */}

      {showGoalModal &&
        selectedGoal && (
          <div
            className="performance-modal-overlay"
            onClick={closeGoal}
          >

            <div
              className="performance-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="performance-modal-header">

                <div>

                  <span className="performance-modal-kicker">
                    Goal Details
                  </span>

                  <h2>
                    {selectedGoal.goal_title ||
                      "Performance Goal"}
                  </h2>

                </div>

                <button
                  type="button"
                  className="performance-modal-close"
                  onClick={closeGoal}
                >
                  <X size={20} />
                </button>

              </div>

              <div className="performance-modal-body">

                {/* CATEGORY */}

                {selectedGoal.goal_category && (
                  <div className="performance-detail-group">

                    <span>
                      Category
                    </span>

                    <strong>
                      {
                        selectedGoal.goal_category
                      }
                    </strong>

                  </div>
                )}

                {/* DESCRIPTION */}

                {selectedGoal.goal_description && (
                  <div className="performance-detail-group">

                    <span>
                      Description
                    </span>

                    <p>
                      {
                        selectedGoal.goal_description
                      }
                    </p>

                  </div>
                )}

                {/* TARGET */}

                {selectedGoal.target && (
                  <div className="performance-detail-group">

                    <span>
                      Target
                    </span>

                    <strong>
                      {
                        selectedGoal.target
                      }
                    </strong>

                  </div>
                )}

                {/* PROGRESS */}

                <div className="performance-detail-group">

                  <span>
                    Progress
                  </span>

                  <strong>
                    {Math.round(
                      getProgress(
                        selectedGoal
                      )
                    )}
                    %
                  </strong>

                </div>

                {/* STATUS */}

                <div className="performance-detail-group">

                  <span>
                    Status
                  </span>

                  <strong>
                    {
                      selectedGoal.goal_status ||
                      "Not Started"
                    }
                  </strong>

                </div>

                {/* DUE DATE */}

                {selectedGoal.due_date && (
                  <div className="performance-detail-group">

                    <span>
                      Due Date
                    </span>

                    <strong>
                      {new Date(
                        selectedGoal.due_date
                      ).toLocaleDateString()}
                    </strong>

                  </div>
                )}

                {/* PERFORMANCE CYCLE */}

                {selectedGoal.cycle_name && (
                  <div className="performance-detail-group">

                    <span>
                      Performance Cycle
                    </span>

                    <strong>
                      {
                        selectedGoal.cycle_name
                      }
                    </strong>

                  </div>
                )}

              </div>

              <div className="performance-modal-footer">

                <button
                  type="button"
                  className="tl-secondary"
                  onClick={closeGoal}
                >
                  Close
                </button>

              </div>

            </div>

          </div>
        )}

      {/* =====================================================
          PERFORMANCE REVIEW MODAL
      ===================================================== */}

      {showRecordModal &&
        selectedRecord && (
          <div
            className="performance-modal-overlay"
            onClick={closeRecord}
          >

            <div
              className="performance-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="performance-modal-header">

                <div>

                  <span className="performance-modal-kicker">
                    Performance Review
                  </span>

                  <h2>
                    {
                      selectedRecord.cycle_name ||
                      "Performance Review"
                    }
                  </h2>

                </div>

                <button
                  type="button"
                  className="performance-modal-close"
                  onClick={closeRecord}
                >
                  <X size={20} />
                </button>

              </div>

              <div className="performance-modal-body">

                {/* REVIEW STATUS */}

                {selectedRecord.review_status && (
                  <div className="performance-detail-group">

                    <span>
                      Review Status
                    </span>

                    <strong>
                      {
                        selectedRecord.review_status
                      }
                    </strong>

                  </div>
                )}

                {/* SELF RATING */}

                {selectedRecord.self_rating !==
                  null &&
                  selectedRecord.self_rating !==
                    undefined && (
                    <div className="performance-detail-group">

                      <span>
                        Self Rating
                      </span>

                      <strong>
                        {
                          selectedRecord.self_rating
                        }
                      </strong>

                    </div>
                  )}

                {/* REVIEWER RATING */}

                {selectedRecord.reviewer_rating !==
                  null &&
                  selectedRecord.reviewer_rating !==
                    undefined && (
                    <div className="performance-detail-group">

                      <span>
                        Reviewer Rating
                      </span>

                      <strong>
                        {
                          selectedRecord.reviewer_rating
                        }
                      </strong>

                    </div>
                  )}

                {/* FINAL RATING */}

                {selectedRecord.final_rating !==
                  null &&
                  selectedRecord.final_rating !==
                    undefined && (
                    <div className="performance-detail-group">

                      <span>
                        Final Rating
                      </span>

                      <strong>
                        {
                          selectedRecord.final_rating
                        }
                      </strong>

                    </div>
                  )}

                {/* STRENGTHS */}

                {selectedRecord.strengths && (
                  <div className="performance-detail-group">

                    <span>
                      Strengths
                    </span>

                    <p>
                      {
                        selectedRecord.strengths
                      }
                    </p>

                  </div>
                )}

                {/* IMPROVEMENT AREAS */}

                {selectedRecord.improvement_areas && (
                  <div className="performance-detail-group">

                    <span>
                      Improvement Areas
                    </span>

                    <p>
                      {
                        selectedRecord.improvement_areas
                      }
                    </p>

                  </div>
                )}

                {/* FEEDBACK */}

                {selectedRecord.feedback && (
                  <div className="performance-detail-group">

                    <span>
                      Feedback
                    </span>

                    <p>
                      {
                        selectedRecord.feedback
                      }
                    </p>

                  </div>
                )}

              </div>

              <div className="performance-modal-footer">

                <button
                  type="button"
                  className="tl-secondary"
                  onClick={closeRecord}
                >
                  Close
                </button>

              </div>

            </div>

          </div>
        )}

    </div>
  );
}
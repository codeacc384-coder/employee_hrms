import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "../lib/supabase";

const AttendanceContext = createContext();

/* =========================================================
   GET EMPLOYEE ID
========================================================= */

const getEmployeeId = () => {
  try {
    const employeeProfile = JSON.parse(
      sessionStorage.getItem("employee") || "{}"
    );

    return (
      sessionStorage.getItem("employeeId") ||
      employeeProfile.employee_id ||
      ""
    );
  } catch (error) {
    console.error(
      "Unable to read employee information:",
      error
    );

    return "";
  }
};

/* =========================================================
   GET TODAY
========================================================= */

const getToday = () => {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/* =========================================================
   CREATE LOCATION TEXT
========================================================= */

const createLocationText = (
  latitude,
  longitude
) => {
  return (
    "Latitude: " +
    Number(latitude).toFixed(5) +
    ", Longitude: " +
    Number(longitude).toFixed(5)
  );
};

/* =========================================================
   CALCULATE WORKING SECONDS
========================================================= */

const calculateWorkingSeconds = (
  checkInAt,
  checkOutAt,
  breakMinutes = 0
) => {
  if (!checkInAt) {
    return 0;
  }

  const start =
    new Date(checkInAt).getTime();

  const end = checkOutAt
    ? new Date(checkOutAt).getTime()
    : new Date().getTime();

  const totalElapsedSeconds =
    Math.max(
      0,
      Math.floor(
        (end - start) / 1000
      )
    );

  const breakSeconds =
    Number(breakMinutes || 0) * 60;

  return Math.max(
    0,
    totalElapsedSeconds -
      breakSeconds
  );
};

/* =========================================================
   CLEAR CURRENT ATTENDANCE STORAGE
========================================================= */

const clearCurrentAttendanceStorage = () => {
  localStorage.removeItem(
    "checkInTime"
  );

  localStorage.removeItem(
    "checkOutTime"
  );

  localStorage.removeItem(
    "employeeLocation"
  );

  localStorage.removeItem(
    "isCheckedIn"
  );

  localStorage.removeItem(
    "isOnBreak"
  );

  localStorage.removeItem(
    "breakStartTime"
  );

  localStorage.removeItem(
    "breakSeconds"
  );

  localStorage.removeItem(
    "attendanceId"
  );

  localStorage.removeItem(
    "attendanceStateDate"
  );
};

/* =========================================================
   PROVIDER
========================================================= */

export function AttendanceProvider({
  children,
}) {
  const [checkInTime, setCheckInTime] =
    useState(null);

  const [checkOutTime, setCheckOutTime] =
    useState(null);

  const [location, setLocation] =
    useState("");

  const [
    checkoutLocation,
    setCheckoutLocation,
  ] = useState("");

  const [isCheckedIn, setIsCheckedIn] =
    useState(false);

  const [
    workingSeconds,
    setWorkingSeconds,
  ] = useState(0);

  const [
    attendanceId,
    setAttendanceId,
  ] = useState(
    localStorage.getItem(
      "attendanceId"
    ) || null
  );

  const [isOnBreak, setIsOnBreak] =
    useState(false);

  const [
    breakStartTime,
    setBreakStartTime,
  ] = useState(null);

  const [
    breakSeconds,
    setBreakSeconds,
  ] = useState(0);

  const [
    attendanceHistory,
    setAttendanceHistory,
  ] = useState([]);

  const [
    loadingAttendance,
    setLoadingAttendance,
  ] = useState(true);

  const [
    checkInPreview,
    setCheckInPreview,
  ] = useState(null);

  const [
    checkOutPreview,
    setCheckOutPreview,
  ] = useState(null);

  const [
    locationLoading,
    setLocationLoading,
  ] = useState(false);

  /* =======================================================
     RESET CURRENT ATTENDANCE
  ======================================================= */

  const resetCurrentAttendance = () => {
    setCheckInTime(null);

    setCheckOutTime(null);

    setLocation("");

    setIsCheckedIn(false);

    setWorkingSeconds(0);

    setIsOnBreak(false);

    setBreakStartTime(null);

    setBreakSeconds(0);

    setAttendanceId(null);

    clearCurrentAttendanceStorage();
  };

  /* =======================================================
     LOAD ATTENDANCE FROM SUPABASE
  ======================================================= */

  const loadAttendanceFromSupabase =
    async () => {
      try {
        setLoadingAttendance(true);

        const employeeId =
          getEmployeeId();

        console.log(
          "Loading attendance for Employee ID:",
          employeeId
        );

        if (!employeeId) {
          console.log(
            "No employee ID found."
          );

          resetCurrentAttendance();

          setCheckoutLocation("");

          setLoadingAttendance(false);

          return;
        }

        /* =================================================
           LOAD REAL ATTENDANCE HISTORY
        ================================================= */

        const {
          data,
          error,
        } = await supabase
          .from(
            "attendance_records"
          )
          .select("*")
          .eq(
            "employee_id",
            employeeId
          )
          .gte(
            "attendance_date",
            "2026-09-01"
          )
          .order(
            "attendance_date",
            {
              ascending: false,
            }
          );

        if (error) {
          console.error(
            "Supabase Attendance Fetch Error:",
            error
          );

          setLoadingAttendance(false);

          return;
        }

        console.log(
          "Attendance records loaded:",
          data
        );

        /* =================================================
           CONVERT RECORDS FOR ATTENDANCE PAGE
        ================================================= */

        const history =
          (data || []).map(
            (record) => {
              const breakSecondsFromDb =
                Number(
                  record.break_minutes ||
                    0
                ) * 60;

              const calculatedWorkingSeconds =
                calculateWorkingSeconds(
                  record.check_in_at,
                  record.check_out_at,
                  record.break_minutes
                );

              let checkInLocation =
                "";

              let checkOutLocation =
                "";

              /* CHECK-IN LOCATION */

              if (
                record.check_in_lat !==
                  null &&
                record.check_in_lat !==
                  undefined &&
                record.check_in_long !==
                  null &&
                record.check_in_long !==
                  undefined
              ) {
                checkInLocation =
                  createLocationText(
                    record.check_in_lat,
                    record.check_in_long
                  );
              }

              /* CHECK-OUT LOCATION */

              if (
                record.check_out_lat !==
                  null &&
                record.check_out_lat !==
                  undefined &&
                record.check_out_long !==
                  null &&
                record.check_out_long !==
                  undefined
              ) {
                checkOutLocation =
                  createLocationText(
                    record.check_out_lat,
                    record.check_out_long
                  );
              }

              return {
                id: record.id,

                date:
                  record.attendance_date,

                checkInTime:
                  record.check_in_at ||
                  null,

                checkInLocation,

                workingSeconds:
                  calculatedWorkingSeconds,

                breakSeconds:
                  breakSecondsFromDb,

                checkOutLocation,

                checkOutTime:
                  record.check_out_at ||
                  null,

                status:
                  record.status ||
                  "Present",
              };
            }
          );

        setAttendanceHistory(
          history
        );

        /* =================================================
           TODAY'S ATTENDANCE
        ================================================= */

        const today =
          getToday();

        const todayRecords =
          (data || []).filter(
            (record) =>
              record.attendance_date ===
              today
          );

        console.log(
          "Today's attendance records:",
          todayRecords
        );

        /* =================================================
           NO ATTENDANCE TODAY
        ================================================= */

        if (
          todayRecords.length === 0
        ) {
          resetCurrentAttendance();

          setCheckoutLocation("");

          return;
        }

        /* =================================================
           FIND ACTIVE RECORD
        ================================================= */

        const activeRecord =
          todayRecords.find(
            (record) =>
              record.check_in_at &&
              !record.check_out_at
          );

        /* =================================================
           ACTIVE CHECK-IN FOUND
        ================================================= */

        if (activeRecord) {
          console.log(
            "Active attendance found:",
            activeRecord
          );

          const savedCheckInTime =
            activeRecord.check_in_at;

          const savedBreakSeconds =
            Number(
              activeRecord.break_minutes ||
                0
            ) * 60;

          /*
           * -----------------------------------------------
           * RESTORE BREAK STATE FROM LOCAL STORAGE
           * -----------------------------------------------
           */

          const savedStateDate =
            localStorage.getItem(
              "attendanceStateDate"
            );

          const savedIsOnBreak =
            localStorage.getItem(
              "isOnBreak"
            ) === "true";

          const savedBreakStartTime =
            localStorage.getItem(
              "breakStartTime"
            );

          const canRestoreBreak =
            savedStateDate === today &&
            savedIsOnBreak &&
            savedBreakStartTime;

          /*
           * -----------------------------------------------
           * CALCULATE WORKING TIME
           * -----------------------------------------------
           */

          let restoredWorkingSeconds =
            calculateWorkingSeconds(
              savedCheckInTime,
              null,
              activeRecord.break_minutes
            );

          /*
           * If a break is currently active,
           * subtract the current ongoing break.
           */

          if (canRestoreBreak) {
            const currentBreakSeconds =
              Math.max(
                0,
                Math.floor(
                  (
                    new Date().getTime() -
                    new Date(
                      savedBreakStartTime
                    ).getTime()
                  ) / 1000
                )
              );

            restoredWorkingSeconds =
              Math.max(
                0,
                restoredWorkingSeconds -
                  currentBreakSeconds
              );
          }

          /* -----------------------------------------------
             RESTORE REACT STATE
          ----------------------------------------------- */

          setAttendanceId(
            activeRecord.id
          );

          setCheckInTime(
            savedCheckInTime
          );

          setCheckOutTime(null);

          setIsCheckedIn(true);

          setWorkingSeconds(
            restoredWorkingSeconds
          );

          setCheckoutLocation("");

          setBreakSeconds(
            savedBreakSeconds
          );

          if (canRestoreBreak) {
            setIsOnBreak(true);

            setBreakStartTime(
              savedBreakStartTime
            );
          } else {
            setIsOnBreak(false);

            setBreakStartTime(null);
          }

          /* -----------------------------------------------
             RESTORE LOCAL STORAGE
          ----------------------------------------------- */

          localStorage.setItem(
            "attendanceId",
            activeRecord.id
          );

          localStorage.setItem(
            "attendanceStateDate",
            today
          );

          localStorage.setItem(
            "checkInTime",
            savedCheckInTime
          );

          localStorage.removeItem(
            "checkOutTime"
          );

          localStorage.setItem(
            "isCheckedIn",
            "true"
          );

          localStorage.setItem(
            "breakSeconds",
            String(
              savedBreakSeconds
            )
          );

          localStorage.setItem(
            "isOnBreak",
            canRestoreBreak
              ? "true"
              : "false"
          );

          if (canRestoreBreak) {
            localStorage.setItem(
              "breakStartTime",
              savedBreakStartTime
            );
          } else {
            localStorage.removeItem(
              "breakStartTime"
            );
          }

          /* -----------------------------------------------
             RESTORE CHECK-IN LOCATION
          ----------------------------------------------- */

          if (
            activeRecord.check_in_lat !==
              null &&
            activeRecord.check_in_lat !==
              undefined &&
            activeRecord.check_in_long !==
              null &&
            activeRecord.check_in_long !==
              undefined
          ) {
            const locationText =
              createLocationText(
                activeRecord.check_in_lat,
                activeRecord.check_in_long
              );

            setLocation(
              locationText
            );

            localStorage.setItem(
              "employeeLocation",
              locationText
            );
          } else {
            setLocation("");
          }

          console.log(
            "Attendance successfully restored after login:",
            {
              attendanceId:
                activeRecord.id,

              checkInTime:
                savedCheckInTime,

              workingSeconds:
                restoredWorkingSeconds,

              breakSeconds:
                savedBreakSeconds,

              isOnBreak:
                canRestoreBreak,
            }
          );

          return;
        }

        /* =================================================
           COMPLETED TODAY'S ATTENDANCE
        ================================================= */

        const completedRecord =
          todayRecords.find(
            (record) =>
              record.check_in_at &&
              record.check_out_at
          );

        if (completedRecord) {
          console.log(
            "Today's attendance is completed:",
            completedRecord
          );

          /*
           * Save checkout location
           */

          if (
            completedRecord.check_out_lat !==
              null &&
            completedRecord.check_out_lat !==
              undefined &&
            completedRecord.check_out_long !==
              null &&
            completedRecord.check_out_long !==
              undefined
          ) {
            const todayCheckoutLocation =
              createLocationText(
                completedRecord.check_out_lat,
                completedRecord.check_out_long
              );

            setCheckoutLocation(
              todayCheckoutLocation
            );

            localStorage.setItem(
              "checkoutLocation",
              todayCheckoutLocation
            );
          } else {
            setCheckoutLocation("");
          }
        }

        /*
         * Attendance completed for today,
         * so current timer must not run.
         */

        resetCurrentAttendance();

        /*
         * resetCurrentAttendance clears
         * attendance storage but does NOT
         * remove checkoutLocation.
         */

        if (completedRecord) {
          if (
            completedRecord.check_out_lat !==
              null &&
            completedRecord.check_out_lat !==
              undefined &&
            completedRecord.check_out_long !==
              null &&
            completedRecord.check_out_long !==
              undefined
          ) {
            const todayCheckoutLocation =
              createLocationText(
                completedRecord.check_out_lat,
                completedRecord.check_out_long
              );

            setCheckoutLocation(
              todayCheckoutLocation
            );

            localStorage.setItem(
              "checkoutLocation",
              todayCheckoutLocation
            );
          }
        }
      } catch (error) {
        console.error(
          "Load Attendance Error:",
          error
        );
      } finally {
        setLoadingAttendance(false);
      }
    };

  /* =======================================================
     LOAD ATTENDANCE WHEN COMPONENT STARTS
     AND WHEN AUTH SESSION CHANGES
  ======================================================= */

  useEffect(() => {
    let isMounted = true;

    const initialLoad =
      async () => {
        if (!isMounted) {
          return;
        }

        await loadAttendanceFromSupabase();
      };

    initialLoad();

    /*
     * Listen for Supabase login/logout.
     */

    const {
      data: authListener,
    } =
      supabase.auth.onAuthStateChange(
        async (
          event,
          session
        ) => {
          console.log(
            "Attendance Auth Event:",
            event
          );

          if (!isMounted) {
            return;
          }

          /*
           * When user logs out,
           * clear current attendance state.
           */

          if (
            event === "SIGNED_OUT"
          ) {
            resetCurrentAttendance();

            setAttendanceHistory([]);

            setCheckoutLocation("");

            return;
          }

          /*
           * When user logs in,
           * reload attendance from Supabase.
           *
           * Small timeout gives Login.jsx
           * time to update sessionStorage
           * with employee information.
           */

          if (
            event === "SIGNED_IN" ||
            event === "TOKEN_REFRESHED" ||
            event === "INITIAL_SESSION"
          ) {
            setTimeout(
              async () => {
                if (!isMounted) {
                  return;
                }

                console.log(
                  "Reloading attendance after authentication..."
                );

                await loadAttendanceFromSupabase();
              },
              200
            );
          }
        }
      );

    return () => {
      isMounted = false;

      authListener.subscription.unsubscribe();
    };
  }, []);

  /* =======================================================
     WORKING TIMER
  ======================================================= */

  useEffect(() => {
    if (
      !isCheckedIn ||
      !checkInTime
    ) {
      return;
    }

    const updateWorkingTimer =
      () => {
        const checkIn =
          new Date(
            checkInTime
          ).getTime();

        const now =
          new Date().getTime();

        const totalElapsedSeconds =
          Math.max(
            0,
            Math.floor(
              (now - checkIn) /
                1000
            )
          );

        /*
         * Previously completed break time
         */

        let totalBreakSeconds =
          Number(
            localStorage.getItem(
              "breakSeconds"
            )
          ) || 0;

        /*
         * Current active break
         */

        if (
          isOnBreak &&
          breakStartTime
        ) {
          const currentBreakSeconds =
            Math.max(
              0,
              Math.floor(
                (
                  now -
                  new Date(
                    breakStartTime
                  ).getTime()
                ) / 1000
              )
            );

          totalBreakSeconds +=
            currentBreakSeconds;
        }

        const actualWorkingSeconds =
          Math.max(
            0,
            totalElapsedSeconds -
              totalBreakSeconds
          );

        setWorkingSeconds(
          actualWorkingSeconds
        );
      };

    /*
     * Run immediately
     */

    updateWorkingTimer();

    /*
     * Continue every second
     */

    const timer =
      setInterval(
        updateWorkingTimer,
        1000
      );

    return () => {
      clearInterval(timer);
    };
  }, [
    isCheckedIn,
    checkInTime,
    isOnBreak,
    breakStartTime,
  ]);

  /* =======================================================
     BREAK TIMER
  ======================================================= */

  useEffect(() => {
    if (
      !isOnBreak ||
      !breakStartTime
    ) {
      return;
    }

    const updateBreakTimer =
      () => {
        const start =
          new Date(
            breakStartTime
          ).getTime();

        const now =
          new Date().getTime();

        const currentBreakSeconds =
          Math.max(
            0,
            Math.floor(
              (now - start) /
                1000
            )
          );

        const previousBreakSeconds =
          Number(
            localStorage.getItem(
              "breakSeconds"
            )
          ) || 0;

        const total =
          previousBreakSeconds +
          currentBreakSeconds;

        setBreakSeconds(
          total
        );
      };

    updateBreakTimer();

    const timer =
      setInterval(
        updateBreakTimer,
        1000
      );

    return () => {
      clearInterval(timer);
    };
  }, [
    isOnBreak,
    breakStartTime,
  ]);

  /* =======================================================
     GET CURRENT LOCATION
  ======================================================= */

  const getCurrentLocation = (
    successCallback,
    errorCallback
  ) => {
    if (
      !navigator.geolocation
    ) {
      alert(
        "Your browser does not support location access."
      );

      if (errorCallback) {
        errorCallback();
      }

      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationLoading(false);

        const latitude =
          Number(
            position.coords.latitude.toFixed(
              5
            )
          );

        const longitude =
          Number(
            position.coords.longitude.toFixed(
              5
            )
          );

        const locationText =
          createLocationText(
            latitude,
            longitude
          );

        successCallback({
          latitude,
          longitude,
          locationText,
        });
      },

      (error) => {
        setLocationLoading(false);

        console.error(
          "Location Error:",
          error
        );

        alert(
          "Unable to detect your current location.\n\nPlease allow location permission and try again."
        );

        if (errorCallback) {
          errorCallback();
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  /* =======================================================
     CHECK IN
  ======================================================= */

  const checkIn = async () => {
    if (isCheckedIn) {
      alert(
        "You are already checked in."
      );

      return;
    }

    const employeeId =
      getEmployeeId();

    if (!employeeId) {
      alert(
        "Employee information is missing. Please login again."
      );

      return;
    }

    getCurrentLocation(
      ({
        latitude,
        longitude,
        locationText,
      }) => {
        setCheckInPreview({
          latitude,
          longitude,
          locationText,
        });
      }
    );
  };

  /* =======================================================
     CANCEL CHECK IN
  ======================================================= */

  const cancelCheckIn = () => {
    setCheckInPreview(null);
  };

  /* =======================================================
     CONFIRM CHECK IN
  ======================================================= */

  const confirmCheckIn =
    async () => {
      if (!checkInPreview) {
        return;
      }

      const employeeId =
        getEmployeeId();

      if (!employeeId) {
        alert(
          "Employee information is missing. Please login again."
        );

        return;
      }

      try {
        const now =
          new Date().toISOString();

        const today =
          getToday();

        const {
          latitude,
          longitude,
          locationText,
        } = checkInPreview;

        /* -----------------------------------------------
           CHECK EXISTING RECORDS
        ----------------------------------------------- */

        const {
          data: existingRecords,
          error: existingError,
        } = await supabase
          .from(
            "attendance_records"
          )
          .select("*")
          .eq(
            "employee_id",
            employeeId
          )
          .eq(
            "attendance_date",
            today
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

        if (existingError) {
          console.error(
            "Attendance Check Error:",
            existingError
          );

          alert(
            "Unable to check today's attendance.\n\n" +
              existingError.message
          );

          return;
        }

        /* -----------------------------------------------
           ACTIVE RECORD
        ----------------------------------------------- */

        const activeRecord =
          (existingRecords || []).find(
            (record) =>
              record.check_in_at &&
              !record.check_out_at
          );

        if (activeRecord) {
          alert(
            "You are already checked in."
          );

          setCheckInPreview(null);

          /*
           * Restore state immediately.
           */

          await loadAttendanceFromSupabase();

          return;
        }

        /* -----------------------------------------------
           COMPLETED RECORD
        ----------------------------------------------- */

        const completedRecord =
          (existingRecords || []).find(
            (record) =>
              record.check_in_at &&
              record.check_out_at
          );

        if (completedRecord) {
          alert(
            "You have already completed attendance for today."
          );

          setCheckInPreview(null);

          return;
        }

        /* -----------------------------------------------
           INSERT CHECK IN
        ----------------------------------------------- */

        const {
          data,
          error,
        } = await supabase
          .from(
            "attendance_records"
          )
          .insert([
            {
              employee_id:
                employeeId,

              attendance_date:
                today,

              check_in_at:
                now,

              break_minutes: 0,

              status:
                "Present",

              check_in_lat:
                latitude,

              check_in_long:
                longitude,
            },
          ])
          .select()
          .single();

        if (error) {
          console.error(
            "Check In Supabase Error:",
            error
          );

          alert(
            "Unable to save check-in.\n\n" +
              error.message
          );

          return;
        }

        console.log(
          "Check-in saved:",
          data
        );

        /* -----------------------------------------------
           UPDATE REACT STATE
        ----------------------------------------------- */

        setAttendanceId(
          data.id
        );

        setCheckInTime(
          now
        );

        setCheckOutTime(
          null
        );

        setLocation(
          locationText
        );

        setCheckoutLocation(
          ""
        );

        setIsCheckedIn(
          true
        );

        setWorkingSeconds(
          0
        );

        setIsOnBreak(
          false
        );

        setBreakStartTime(
          null
        );

        setBreakSeconds(
          0
        );

        setCheckInPreview(
          null
        );

        /* -----------------------------------------------
           UPDATE LOCAL STORAGE
        ----------------------------------------------- */

        localStorage.setItem(
          "attendanceId",
          data.id
        );

        localStorage.setItem(
          "attendanceStateDate",
          today
        );

        localStorage.setItem(
          "checkInTime",
          now
        );

        localStorage.removeItem(
          "checkOutTime"
        );

        localStorage.setItem(
          "employeeLocation",
          locationText
        );

        localStorage.setItem(
          "isCheckedIn",
          "true"
        );

        localStorage.setItem(
          "isOnBreak",
          "false"
        );

        localStorage.removeItem(
          "breakStartTime"
        );

        localStorage.setItem(
          "breakSeconds",
          "0"
        );

        /* -----------------------------------------------
           ADD TO HISTORY
        ----------------------------------------------- */

        const newRecord = {
          id: data.id,

          date: today,

          checkInTime: now,

          checkInLocation:
            locationText,

          workingSeconds: 0,

          breakSeconds: 0,

          checkOutLocation: "",

          checkOutTime: null,

          status: "Present",
        };

        setAttendanceHistory(
          (previousHistory) => [
            newRecord,
            ...previousHistory,
          ]
        );

        alert(
          "Check In confirmed successfully!"
        );
      } catch (error) {
        console.error(
          "Confirm Check In Error:",
          error
        );

        alert(
          "Something went wrong.\n\n" +
            error.message
        );
      }
    };

  /* =======================================================
     START BREAK
  ======================================================= */

  const startBreak = () => {
    if (!isCheckedIn) {
      alert(
        "Please check in before starting a break."
      );

      return;
    }

    if (isOnBreak) {
      return;
    }

    const now =
      new Date().toISOString();

    setBreakStartTime(
      now
    );

    setIsOnBreak(
      true
    );

    localStorage.setItem(
      "breakStartTime",
      now
    );

    localStorage.setItem(
      "isOnBreak",
      "true"
    );
  };

  /* =======================================================
     END BREAK
  ======================================================= */

  const endBreak = async () => {
    if (
      !isOnBreak ||
      !breakStartTime
    ) {
      return;
    }

    try {
      const now =
        new Date().getTime();

      const start =
        new Date(
          breakStartTime
        ).getTime();

      const currentBreakSeconds =
        Math.max(
          0,
          Math.floor(
            (now - start) /
              1000
          )
        );

      const previousBreakSeconds =
        Number(
          localStorage.getItem(
            "breakSeconds"
          )
        ) || 0;

      const totalBreakSeconds =
        previousBreakSeconds +
        currentBreakSeconds;

      const totalBreakMinutes =
        Math.ceil(
          totalBreakSeconds /
            60
        );

      setBreakSeconds(
        totalBreakSeconds
      );

      setIsOnBreak(
        false
      );

      setBreakStartTime(
        null
      );

      localStorage.setItem(
        "breakSeconds",
        String(
          totalBreakSeconds
        )
      );

      localStorage.setItem(
        "isOnBreak",
        "false"
      );

      localStorage.removeItem(
        "breakStartTime"
      );

      /* -----------------------------------------------
         UPDATE DATABASE
      ----------------------------------------------- */

      if (attendanceId) {
        const {
          error,
        } = await supabase
          .from(
            "attendance_records"
          )
          .update({
            break_minutes:
              totalBreakMinutes,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            attendanceId
          );

        if (error) {
          console.error(
            "Break Update Error:",
            error
          );

          alert(
            "Break ended, but database update failed.\n\n" +
              error.message
          );
        }
      }
    } catch (error) {
      console.error(
        "End Break Error:",
        error
      );
    }
  };

  /* =======================================================
     CHECK OUT
  ======================================================= */

  const checkOut = () => {
    if (!isCheckedIn) {
      return;
    }

    const employeeId =
      getEmployeeId();

    if (!employeeId) {
      alert(
        "Employee information is missing. Please login again."
      );

      return;
    }

    getCurrentLocation(
      ({
        latitude,
        longitude,
        locationText,
      }) => {
        setCheckOutPreview({
          latitude,
          longitude,
          locationText,
        });
      }
    );
  };

  /* =======================================================
     CANCEL CHECK OUT
  ======================================================= */

  const cancelCheckOut = () => {
    setCheckOutPreview(null);
  };

  /* =======================================================
     CONFIRM CHECK OUT
  ======================================================= */

  const confirmCheckOut =
    async () => {
      if (!checkOutPreview) {
        return;
      }

      if (!isCheckedIn) {
        setCheckOutPreview(
          null
        );

        return;
      }

      try {
        const now =
          new Date().toISOString();

        const {
          latitude,
          longitude,
          locationText,
        } = checkOutPreview;

        /* -----------------------------------------------
           CALCULATE FINAL BREAK
        ----------------------------------------------- */

        let finalBreakSeconds =
          breakSeconds;

        if (
          isOnBreak &&
          breakStartTime
        ) {
          finalBreakSeconds +=
            Math.max(
              0,
              Math.floor(
                (
                  new Date().getTime() -
                  new Date(
                    breakStartTime
                  ).getTime()
                ) / 1000
              )
            );
        }

        const finalBreakMinutes =
          Math.ceil(
            finalBreakSeconds /
              60
          );

        /* -----------------------------------------------
           CALCULATE FINAL WORKING TIME
        ----------------------------------------------- */

        const totalElapsed =
          Math.floor(
            (
              new Date(
                now
              ).getTime() -
              new Date(
                checkInTime
              ).getTime()
            ) / 1000
          );

        const finalWorkingSeconds =
          Math.max(
            0,
            totalElapsed -
              finalBreakSeconds
          );

        /* -----------------------------------------------
           CHECK ATTENDANCE ID
        ----------------------------------------------- */

        if (!attendanceId) {
          alert(
            "Attendance record ID is missing. Please refresh the page and try again."
          );

          return;
        }

        /* -----------------------------------------------
           UPDATE DATABASE
        ----------------------------------------------- */

        const {
          data,
          error,
        } = await supabase
          .from(
            "attendance_records"
          )
          .update({
            check_out_at:
              now,

            check_out_lat:
              latitude,

            check_out_long:
              longitude,

            break_minutes:
              finalBreakMinutes,

            status:
              "Present",

            updated_at:
              now,
          })
          .eq(
            "id",
            attendanceId
          )
          .select();

        if (error) {
          console.error(
            "Checkout Supabase Error:",
            error
          );

          alert(
            "Unable to save checkout.\n\n" +
              error.message
          );

          return;
        }

        console.log(
          "Checkout saved:",
          data
        );

        /* -----------------------------------------------
           CREATE COMPLETED RECORD
        ----------------------------------------------- */

        const record = {
          id: attendanceId,

          date: getToday(),

          checkInTime:
            checkInTime,

          checkInLocation:
            location,

          workingSeconds:
            finalWorkingSeconds,

          breakSeconds:
            finalBreakSeconds,

          checkOutLocation:
            locationText,

          checkOutTime:
            now,

          status:
            "Present",
        };

        /* -----------------------------------------------
           UPDATE HISTORY
        ----------------------------------------------- */

        setAttendanceHistory(
          (previousHistory) => {
            const existingIndex =
              previousHistory.findIndex(
                (item) =>
                  item.id ===
                  attendanceId
              );

            if (
              existingIndex !==
              -1
            ) {
              const updated = [
                ...previousHistory,
              ];

              updated[
                existingIndex
              ] = record;

              return updated;
            }

            return [
              record,
              ...previousHistory,
            ];
          }
        );

        /* -----------------------------------------------
           SAVE CHECKOUT LOCATION
        ----------------------------------------------- */

        setCheckoutLocation(
          locationText
        );

        localStorage.setItem(
          "checkoutLocation",
          locationText
        );

        /* -----------------------------------------------
           CLEAR ACTIVE ATTENDANCE
        ----------------------------------------------- */

        setCheckOutPreview(
          null
        );

        resetCurrentAttendance();

        /*
         * Restore checkout location because
         * resetCurrentAttendance intentionally
         * does not clear it.
         */

        setCheckoutLocation(
          locationText
        );

        localStorage.setItem(
          "checkoutLocation",
          locationText
        );

        alert(
          "Check Out confirmed successfully!\n\nToday's attendance has been saved."
        );
      } catch (error) {
        console.error(
          "Confirm Checkout Error:",
          error
        );

        alert(
          "Something went wrong while checking out.\n\n" +
            error.message
        );
      }
    };

  /* =======================================================
     FORMAT TIME
  ======================================================= */

  const formatTime = (
    totalSeconds
  ) => {
    const hours =
      Math.floor(
        totalSeconds / 3600
      );

    const minutes =
      Math.floor(
        (totalSeconds % 3600) /
          60
      );

    const seconds =
      totalSeconds % 60;

    return (
      String(hours).padStart(
        2,
        "0"
      ) +
      ":" +
      String(minutes).padStart(
        2,
        "0"
      ) +
      ":" +
      String(seconds).padStart(
        2,
        "0"
      )
    );
  };

  /* =======================================================
     FORMAT BREAK TIME
  ======================================================= */

  const formatBreakTime = (
    totalSeconds
  ) => {
    const minutes =
      Math.floor(
        totalSeconds / 60
      );

    const seconds =
      totalSeconds % 60;

    if (minutes === 0) {
      return `${seconds}s`;
    }

    return (
      `${minutes}m ` +
      `${String(seconds).padStart(
        2,
        "0"
      )}s`
    );
  };

  /* =======================================================
     CONTEXT PROVIDER
  ======================================================= */

  return (
    <AttendanceContext.Provider
      value={{
        checkInTime,

        checkOutTime,

        location,

        checkoutLocation,

        isCheckedIn,

        workingSeconds,

        checkIn,

        confirmCheckIn,

        cancelCheckIn,

        checkOut,

        confirmCheckOut,

        cancelCheckOut,

        checkInPreview,

        checkOutPreview,

        locationLoading,

        isOnBreak,

        breakStartTime,

        breakSeconds,

        startBreak,

        endBreak,

        formatTime,

        formatBreakTime,

        attendanceHistory,

        loadingAttendance,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
}

/* =========================================================
   USE ATTENDANCE HOOK
========================================================= */

export function useAttendance() {
  return useContext(
    AttendanceContext
  );
}
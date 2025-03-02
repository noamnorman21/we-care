﻿using DATA;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApi.DTO
{
    public class PrivateTaskDTO
    {
        public string taskName { get; set; }
        public System.DateTime taskFromDate { get; set; }
        public Nullable<System.DateTime> taskToDate { get; set; }
        public string taskComment { get; set; }
        public string status { get; set; }
        public int workerId { get; set; }
        public Nullable<System.TimeSpan> TimeInDay { get; set; }
        public string frequency { get; set; }
        public TimeSpan[] timesInDayArr { get; set; }
        public virtual tblForeignUser tblForeignUser { get; set; }
    }
}